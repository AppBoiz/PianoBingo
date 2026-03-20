import { test, expect } from '@playwright/test'
import { pianoBingoLocator } from '../support/locators'

test.describe('Storage compatibility and migration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('PianoBingoDB')
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      })
    })
  })

  test('localStorage migration: id → songId', async ({ page }) => {
    // Set up legacy gameState BEFORE page loads
    await page.addInitScript(() => {
      const legacyGameState = {
        selectedSongPackId: 1,
        shownSongIds: [1, 2],
        currentSong: {
          id: 42,  // Legacy field name
          title: 'Test Song',
          pdfUrl: 'data:application/pdf;base64,test'
        }
      }
      localStorage.setItem('gameState', JSON.stringify(legacyGameState))
    })

    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    await page.goto('/')

    // Wait for migration to complete — songId field must exist on currentSong
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('gameState')
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw)
        return parsed.currentSong && 'songId' in parsed.currentSong
      } catch { return false }
    })

    const migratedState = await page.evaluate(() => {
      const state = localStorage.getItem('gameState')
      return state ? JSON.parse(state) : null
    })

    expect(migratedState).not.toBeNull()
    expect(migratedState.currentSong.songId).toBe(42)
    expect(migratedState.currentSong.id).toBeUndefined()

    const hasMigrationLog = consoleLogs.some((log: string) => log.includes('Migrated legacy gameState'))
    expect(hasMigrationLog).toBeTruthy()
  })

  test('default gameState has null selectedSongPackId', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')

    const gameState = await page.evaluate(() => {
      const state = localStorage.getItem('gameState')
      return state ? JSON.parse(state) : null
    })

    expect(gameState).not.toBeNull()
    expect(gameState.selectedSongPackId).toBeNull()
    expect(gameState.shownSongIds).toEqual([])
    expect(gameState.currentSong.songId).toBeNull()
  })

  test('base seed data uses version 1', async ({ page }) => {
    // beforeEach cleared the DB and left the page in a post-boot state where
    // firstTimeOpeningDB === false. Reload to get a fresh module state so that
    // the next openDB() call triggers seeding again.
    const consoleLogs: string[] = []
    page.on('console', msg => consoleLogs.push(msg.text()))

    await page.goto('/')

    // Wait for preloaded data to be ready before triggering IDB seeding
    await expect(async () => {
      expect(consoleLogs.join('\n')).toContain('Preloaded data initialized')
    }).toPass({ timeout: 10000 })

    // Navigate to pack management to trigger openDB() → IDB seeding
    await page.evaluate(() => {
      window.history.pushState({}, '', '/pack-management')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    // Poll until both stores are seeded and all records have version === 1
    // Uses page.evaluate inside expect().toPass() — the correct pattern for
    // Promise-based browser checks (see CODING_AGENT_CONTEXT §"Build fix" note).
    type VersionCheck = { packsAllV1: boolean; songsAllV1: boolean; packsCount: number; songsCount: number }
    let result: VersionCheck | null = null

    await expect(async () => {
      try {
        result = await page.evaluate(() => {
          return new Promise<VersionCheck | null>((resolve) => {
            const req = indexedDB.open('PianoBingoDB', 1)
            req.onsuccess = () => {
              const db = req.result
              let packs: any[] = [], songs: any[] = [], remaining = 2

              function finish() {
                if (--remaining === 0) {
                  db.close()
                  if (packs.length !== 2 || songs.length !== 150) { resolve(null); return }
                  resolve({
                    packsCount: packs.length,
                    songsCount: songs.length,
                    packsAllV1: packs.every((p: any) => p.version === 1),
                    songsAllV1: songs.every((s: any) => s.version === 1),
                  })
                }
              }

              const pt = db.transaction('packs', 'readonly')
              const pr = pt.objectStore('packs').getAll()
              pr.onsuccess = () => { packs = pr.result; finish() }
              pr.onerror = () => { db.close(); resolve(null) }

              const st = db.transaction('songs', 'readonly')
              const sr = st.objectStore('songs').getAll()
              sr.onsuccess = () => { songs = sr.result; finish() }
              sr.onerror = () => { db.close(); resolve(null) }
            }
            req.onerror = () => resolve(null)
          })
        })
      } catch {
        result = null // context destroyed by SW clientsClaim — will retry
      }
      expect(result).not.toBeNull()
    }).toPass({ timeout: 30000 })

    expect(result!.packsAllV1).toBe(true)
    expect(result!.songsAllV1).toBe(true)
    expect(result!.packsCount).toBe(2)
    expect(result!.songsCount).toBe(150)
  })

  test('migration preserves all gameState fields', async ({ page }) => {
    await page.addInitScript(() => {
      const legacyState = {
        selectedSongPackId: 2,
        shownSongIds: [10, 20, 30],
        currentSong: {
          id: 25,
          title: 'Legacy Song',
          pdfUrl: 'data:test',
          customField: 'extra'
        },
        extraField: 'preserved'
      }
      localStorage.setItem('gameState', JSON.stringify(legacyState))
    })

    await page.goto('/')

    // Wait for migration to complete
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('gameState')
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw)
        return parsed.currentSong && 'songId' in parsed.currentSong
      } catch { return false }
    })

    const migrated = await page.evaluate(() => {
      const state = localStorage.getItem('gameState')
      return state ? JSON.parse(state) : null
    })

    expect(migrated.selectedSongPackId).toBe(2)
    expect(migrated.shownSongIds).toEqual([10, 20, 30])
    expect(migrated.currentSong.songId).toBe(25)
    expect(migrated.currentSong.title).toBe('Legacy Song')
    expect(migrated.currentSong.customField).toBe('extra')
    expect(migrated.extraField).toBe('preserved')
  })

  test('modern gameState is not affected by migration', async ({ page }) => {
    await page.addInitScript(() => {
      const modernState = {
        selectedSongPackId: 3,
        shownSongIds: [5, 6],
        currentSong: {
          songId: 15,
          title: 'Modern Song',
          pdfUrl: 'data:modern'
        }
      }
      localStorage.setItem('gameState', JSON.stringify(modernState))
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const state = await page.evaluate(() => {
      const state = localStorage.getItem('gameState')
      return state ? JSON.parse(state) : null
    })

    expect(state.currentSong.songId).toBe(15)
    expect(state.currentSong.id).toBeUndefined()
  })
})
