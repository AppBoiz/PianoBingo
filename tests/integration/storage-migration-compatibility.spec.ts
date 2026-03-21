import { test } from '@playwright/test'
import { expect, pianoBingoLocator } from '../support/locators'

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

    await app.welcomePage().action('new-game').click()
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
    const app = pianoBingoLocator(page)
    const consoleLogs: string[] = []
    page.on('console', msg => consoleLogs.push(msg.text()))

    await page.goto('/')

    // Wait for preloaded data to be ready before triggering IDB seeding
    await expect(async () => {
      expect(consoleLogs.join('\n')).toContain('Preloaded data initialized')
    }).toPass({ timeout: 10000 })

    // Wait for the React app (BrowserRouter) to mount so React Router is listening
    // for popstate events before we fire the synthetic navigation below.
    // "Preloaded data initialized" fires inside initializePreloadedData(), which is
    // awaited in main.tsx before createRoot().render() is called — so React hasn't
    // mounted yet at that exact moment.
    await expect(app.welcomePage()).toBeVisible()

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

// ---------------------------------------------------------------------------
// Helpers shared by the seeding-protection and version-increment suites
// ---------------------------------------------------------------------------

/**
 * Runs in the browser: returns a record from `PianoBingoDB[storeName]` by key.
 * The function is serialised and sent to the browser by page.evaluate, so it
 * must only use browser APIs and receive a single serialisable argument.
 */
function _idbGet({ storeName, key }: { storeName: string; key: number }): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open('PianoBingoDB', 1)
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve(null); return }
      const r = db.transaction(storeName, 'readonly').objectStore(storeName).get(key) as IDBRequest<Record<string, unknown> | undefined>
      r.onsuccess = () => { db.close(); resolve(r.result ?? null) }
      r.onerror   = () => { db.close(); resolve(null) }
    }
    req.onerror = () => resolve(null)
  })
}

/**
 * Runs in the browser: writes `record` into `PianoBingoDB[storeName]`.
 * Creates the object stores if the DB is brand-new.
 */
function _idbPut({ storeName, record }: { storeName: string; record: Record<string, unknown> }): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.open('PianoBingoDB', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
      if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).put(record)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror   = () => { db.close(); resolve() }
    }
    req.onerror = () => resolve()
  })
}

/** Navigate in-SPA to a route via pushState (does not cause a full page reload). */
async function spaNavigate(page: any, path: string) {
  await page.evaluate((p: string) => {
    window.history.pushState({}, '', p)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

/** Wait until `window.BASE_PACK_DATA` contains at least one entry (preload is done). */
async function waitForBaseData(page: any) {
  await expect(async () => {
    const ready = await page.evaluate(
      () => Array.isArray((window as any).BASE_PACK_DATA) && (window as any).BASE_PACK_DATA.length > 0
    )
    expect(ready).toBe(true)
  }).toPass({ timeout: 15000 })
}

// ---------------------------------------------------------------------------
// Seeding protection: user-edited defaults must not be overwritten
// ---------------------------------------------------------------------------

test.describe('IDB seeding — user-edited default data is preserved on app update', () => {
  // Each test seeds user-modified data directly into IDB, then triggers the lazy
  // openDB() → seeding path by navigating to pack-management.
  // The seeding guard is: skip if (existing.version ?? 0) >= (base.version ?? 0).

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('PianoBingoDB')
        req.onsuccess = () => resolve()
        req.onerror   = () => resolve()
      })
    })
  })

  test('user-edited default pack (version > base version) is not overwritten by seeding', async ({ page }) => {
    // Simulate user having edited the default "Tom" pack: version bumped to 2, name changed.
    await page.evaluate(_idbPut, { storeName: 'packs', record: { packId: 1, packName: 'My Edited Tom', songs: [1, 2], songCount: 2, version: 2 } })

    // Wait until the preloaded base data (version 1 packs) is available on the window,
    // so that the seeding logic actually runs when we navigate.
    await waitForBaseData(page)

    // Navigate to pack-management → triggers loadAllPacks() → openDB() → seeding attempt.
    await spaNavigate(page, '/pack-management')

    // Poll IDB: pack 1 must still be at version 2 with the user's name intact.
    type PackRecord = { packName: string; version: number }
    let pack: PackRecord | null = null
    await expect(async () => {
      pack = await page.evaluate(_idbGet, { storeName: 'packs', key: 1 }) as PackRecord | null
      expect(pack).not.toBeNull()
    }).toPass({ timeout: 15000 })

    expect(pack!.packName).toBe('My Edited Tom')
    expect(pack!.version).toBe(2) // seeding must NOT reset this to base version 1
  })

  test('user-edited default song (version > base version) is not overwritten by seeding', async ({ page }) => {
    // Simulate user having edited default song 1: version bumped to 2, title changed.
    await page.evaluate(_idbPut, { storeName: 'songs', record: { songId: 1, title: 'My Custom Song Title', pdfUrl: null, version: 2 } })

    // Wait for base pack data to be available so seeding actually runs.
    await waitForBaseData(page)

    // Trigger seeding by navigating to pack-management.
    await spaNavigate(page, '/pack-management')

    // Poll IDB: song 1 must still have the user's title at version 2.
    type SongRecord = { title: string; version: number }
    let song: SongRecord | null = null
    await expect(async () => {
      song = await page.evaluate(_idbGet, { storeName: 'songs', key: 1 }) as SongRecord | null
      expect(song).not.toBeNull()
    }).toPass({ timeout: 15000 })

    expect(song!.title).toBe('My Custom Song Title')
    expect(song!.version).toBe(2) // seeding must NOT reset this to base version 1
  })
})

// ---------------------------------------------------------------------------
// Seeding protection: user-added packs/songs must survive seeding
// ---------------------------------------------------------------------------

test.describe('IDB seeding — user-added packs and songs survive an app update', () => {
  // packId ≥ 1_000_000 is the user-created partition (PACK_ID_PARTITION_SIZE).

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      localStorage.clear()
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('PianoBingoDB')
        req.onsuccess = () => resolve()
        req.onerror   = () => resolve()
      })
    })
  })

  test('user-created pack (packId ≥ PACK_ID_PARTITION_SIZE) is not removed by seeding', async ({ page }) => {
    const USER_PACK_ID = 1_000_000
    await page.evaluate(_idbPut, { storeName: 'packs', record: { packId: USER_PACK_ID, packName: 'User Added Pack', songs: [], songCount: 0, version: 1 } })

    // Ensure base data is ready so seeding runs in full.
    await waitForBaseData(page)

    // Trigger seeding.
    await spaNavigate(page, '/pack-management')

    // Poll IDB: the user pack must still exist after seeding.
    let pack: Record<string, unknown> | null = null
    await expect(async () => {
      pack = await page.evaluate(_idbGet, { storeName: 'packs', key: USER_PACK_ID })
      expect(pack).not.toBeNull()
    }).toPass({ timeout: 15000 })

    expect(pack!.packName).toBe('User Added Pack')
  })

  test('user-created song (songId outside default range) is not removed by seeding', async ({ page }) => {
    const USER_SONG_ID = 999 // outside the default 1–150 range used by seeding
    await page.evaluate(_idbPut, { storeName: 'songs', record: { songId: USER_SONG_ID, title: 'User Added Song', pdfUrl: null, version: 1 } })

    // Ensure base data is ready so seeding runs in full.
    await waitForBaseData(page)

    // Trigger seeding.
    await spaNavigate(page, '/pack-management')

    // Poll IDB: the user song must still exist after seeding.
    let song: Record<string, unknown> | null = null
    await expect(async () => {
      song = await page.evaluate(_idbGet, { storeName: 'songs', key: USER_SONG_ID })
      expect(song).not.toBeNull()
    }).toPass({ timeout: 15000 })

    expect(song!.title).toBe('User Added Song')
  })
})

// ---------------------------------------------------------------------------
// Version increment: every edit must bump the record's version
// ---------------------------------------------------------------------------

test.describe('version increments on every edit', () => {
  // Suppress base data so that seeding never runs and cannot interfere.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const empty: unknown[] = []
      Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
      Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
    })
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('PianoBingoDB')
        req.onsuccess = () => resolve()
        req.onerror   = () => resolve()
      })
    })
  })

  test('renaming a pack increments its version by 1 in IDB', async ({ page }) => {
    const app = pianoBingoLocator(page)

    // Seed a pack at version 1 (beforeEach already cleared DB and loaded the
    // app fresh with firstTimeOpeningDB = true and BASE_PACK_DATA suppressed).
    await page.evaluate(_idbPut, { storeName: 'packs', record: { packId: 1, packName: 'Original Pack', songs: [], songCount: 0, version: 1 } })

    // Navigate to pack management and confirm the pack loaded.
    await spaNavigate(page, '/pack-management')
    await expect(app.packManagementPage()).toBeVisible()
    await expect(app.packManagementPage().nameInput(1).locate()).toHaveValue('Original Pack')

    // Rename — this calls renamePack → savePack which does version + 1.
    await app.packManagementPage().nameInput(1).fill('Renamed Pack')
    await app.packManagementPage().nameInput(1).press('Tab')
    await page.waitForLoadState('networkidle')

    // Read the pack directly from IDB and verify the version was incremented.
    type PackRecord = { packName: string; version: number }
    let pack: PackRecord | null = null
    await expect(async () => {
      pack = await page.evaluate(_idbGet, { storeName: 'packs', key: 1 }) as PackRecord | null
      expect(pack).not.toBeNull()
      expect((pack as NonNullable<PackRecord>).version).toBeGreaterThanOrEqual(2)
    }).toPass({ timeout: 10000 })

    expect(pack!.packName).toBe('Renamed Pack')
    expect(pack!.version).toBe(2) // version 1 → save → version 2
  })

  test('renaming a song increments its version by 1 in IDB', async ({ page }) => {
    const app = pianoBingoLocator(page)

    // Seed a song at version 1 (beforeEach already cleared DB and loaded the
    // app fresh with firstTimeOpeningDB = true and BASE_PACK_DATA suppressed).
    await page.evaluate(_idbPut, { storeName: 'songs', record: { songId: 1, title: 'Original Song', pdfUrl: null, version: 1 } })

    // Navigate to song management and confirm the song loaded.
    await spaNavigate(page, '/song-management')
    await expect(app.songManagementPage()).toBeVisible()
    await expect(app.songManagementPage().nameInput(1).locate()).toHaveValue('Original Song')

    // Rename — this calls renameSong → saveSong which does version + 1.
    await app.songManagementPage().nameInput(1).fill('Renamed Song')
    await app.songManagementPage().nameInput(1).press('Tab')
    await page.waitForLoadState('networkidle')

    // Read the song directly from IDB and verify the version was incremented.
    type SongRecord = { title: string; version: number }
    let song: SongRecord | null = null
    await expect(async () => {
      song = await page.evaluate(_idbGet, { storeName: 'songs', key: 1 }) as SongRecord | null
      expect(song).not.toBeNull()
      expect((song as NonNullable<SongRecord>).version).toBeGreaterThanOrEqual(2)
    }).toPass({ timeout: 10000 })

    expect(song!.title).toBe('Renamed Song')
    expect(song!.version).toBe(2) // version 1 → save → version 2
  })
})
