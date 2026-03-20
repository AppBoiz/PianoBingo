/**
 * Edge-case tests covering app-logic risks identified in the deep audit.
 * Each test documents the specific risk it guards against.
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { pianoBingoLocator, pianoExpect } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearStorage(page: any) {
  await page.evaluate(async () => {
    localStorage.clear()
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('PianoBingoDB')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
  })
}

async function seedSingleSongPack(page: any) {
  await page.goto('/')
  await clearStorage(page)
  await page.evaluate(async (pdf: string) => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.open('PianoBingoDB', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('packs'))
          db.createObjectStore('packs', { keyPath: 'packId' })
        if (!db.objectStoreNames.contains('songs'))
          db.createObjectStore('songs', { keyPath: 'songId' })
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['packs', 'songs'], 'readwrite')
        tx.objectStore('packs').put({ packId: 1, packName: 'Solo Pack', songs: [1], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Solo Song', pdfUrl: pdf, version: 1 })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function seedTwoSongPack(page: any) {
  await page.goto('/')
  await clearStorage(page)
  await page.evaluate(async (pdf: string) => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.open('PianoBingoDB', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('packs'))
          db.createObjectStore('packs', { keyPath: 'packId' })
        if (!db.objectStoreNames.contains('songs'))
          db.createObjectStore('songs', { keyPath: 'songId' })
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['packs', 'songs'], 'readwrite')
        tx.objectStore('packs').put({ packId: 1, packName: 'Duo Pack', songs: [1, 2], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'First Song', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 2, title: 'Second Song', pdfUrl: pdf, version: 1 })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

// ---------------------------------------------------------------------------
// Route guard: direct navigation without game state (RISK 1.1)
// ---------------------------------------------------------------------------

test.describe('Direct navigation without game state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearStorage(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
  })

  test('/game without game state renders without crash', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 1.1: No route guards — navigating directly to /game should never throw a JS exception.
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await pianoExpect(app).toBeVisible()
  })

  test('/game-history without game state shows "No active game"', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 1.3: Navigating directly to /game-history without a selected pack shows a graceful message.
    await page.goto('/')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game-history')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGameHistory().header()).toBeVisible()
    await pianoExpect(app.pageGameHistory().emptyState()).toBeVisible()
    await pianoExpect(app.pageGameHistory().boxes()).toHaveCount(0)
  })

  test('/pack-edit with invalid packId renders gracefully', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 1.4: Navigating to /pack-edit/9999 when that pack does not exist should not crash.
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/pack-edit/9999')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await pianoExpect(app).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Pack exhaustion: all songs shown (RISK 1.5)
// ---------------------------------------------------------------------------

test.describe('Pack exhaustion', () => {
  test('advancing past last song in single-song pack does not crash', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 1.5: generateSong() returns null when there are no more songs to show.
    // Clicking Next Song at that point must not throw or crash the page.
    await seedSingleSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await app.pageWelcome().action('new-game').click()
    await app.pagePackSelect().packRadioInputs().first().click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGame().nextSong()).toBeVisible()
    await pianoExpect(app.pageGame().header().getByText('Solo Song')).toBeVisible()

    // Attempt to advance — pack is now exhausted, generateSong() returns null
    await app.pageGame().nextSong().click()
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await pianoExpect(app.pageGame().header()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Hamburger menu closes after item click (BUG — GameMenu.tsx fix)
// ---------------------------------------------------------------------------

test.describe('Hamburger menu behaviour', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await seedSingleSongPack(page)
  })

  test('menu closes after each menu item click', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // BUG: Before the fix, the #menu-toggle checkbox was never unchecked after an action
    // click, leaving the menu visually open. Verify the fix holds across multiple open/close cycles.

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().packRadioInputs().first().click()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')
    await pianoExpect(app.pageGame().nextSong()).toBeVisible()

    // First cycle: open menu, click "Next Song"
    await app.pageGame().menuToggle().click()
    await pianoExpect(app.pageGame().menu()).toBeVisible()
    await app.pageGame().menuItem('next-song').click()
    await page.waitForLoadState('networkidle')
    let isChecked = await page.evaluate(() => {
      const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
      return toggle?.checked ?? true
    })
    expect(isChecked).toBe(false)

    // Second cycle: open menu again, click "Prev Song" — must also close
    await app.pageGame().menuToggle().click()
    await pianoExpect(app.pageGame().menu()).toBeVisible()
    await app.pageGame().menuItem('prev-song').click()
    await page.waitForLoadState('networkidle')
    isChecked = await page.evaluate(() => {
      const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
      return toggle?.checked ?? true
    })
    expect(isChecked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Deleting actively-used data mid-game (RISK 4.2 and 4.3)
// ---------------------------------------------------------------------------

test.describe('Data deletion during active game', () => {
  test('deleting the currently-playing song then returning to game does not crash', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 4.2: User deletes a song from song management while that song is actively
    // being played. The game page must handle it gracefully.
    await seedTwoSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().packRadioInputs().first().click()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')
    await pianoExpect(app.pageGame().nextSong()).toBeVisible()

    // Delete song 1 directly from IndexedDB (simulates user deleting from song management)
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('songs', 'readwrite')
          tx.objectStore('songs').delete(1)
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await pianoExpect(app.pageGame().header()).toBeVisible()
  })

  test('deleting the active pack then returning to game does not crash', async ({ page }) => {
    const app = pianoBingoLocator(page)
    // RISK 4.3: User deletes the entire pack that is currently selected for the game.
    await seedTwoSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().packRadioInputs().first().click()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')
    await pianoExpect(app.pageGame().nextSong()).toBeVisible()

    // Delete pack 1 directly from IndexedDB
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('packs', 'readwrite')
          tx.objectStore('packs').delete(1)
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    })

    // Attempt to advance song — generateSong() can now not find the pack
    await app.pageGame().nextSong().click()
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await pianoExpect(app.pageGame().header()).toBeVisible()
  })
})
