/**
 * Edge-case tests covering app-logic risks identified in the deep audit.
 * Each test documents the specific risk it guards against.
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

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
    // RISK 1.1: No route guards — navigating directly to /game should never throw a JS exception.
    // The page shows a blank/loading PDF viewer because no song is loaded, but must not crash.
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    // No JS exceptions
    expect(errors).toHaveLength(0)

    // The root app shell should still render
    await expect(page.locator('body')).toBeVisible()
  })

  test('/game-history without game state shows "No active game"', async ({ page }) => {
    // RISK 1.3: Navigating directly to /game-history without a selected pack should show
    // a graceful message rather than an error or blank screen.
    await page.goto('/')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game-history')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Game History' })).toBeVisible()
    await expect(page.locator('text=No active game')).toBeVisible()
    await expect(page.locator('.box')).toHaveCount(0)
  })

  test('/pack-edit with invalid packId renders gracefully', async ({ page }) => {
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
    // Page must render something — at minimum the layout shell
    await expect(page.locator('body')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Pack exhaustion: all songs shown (RISK 1.5)
// ---------------------------------------------------------------------------

test.describe('Pack exhaustion', () => {
  test('advancing past last song in single-song pack does not crash', async ({ page }) => {
    // RISK 1.5: generateSong() returns null when there are no more songs to show.
    // Clicking Next Song at that point must not throw or crash the page.
    await seedSingleSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Start game — sole song is drawn
    await page.click('text=New Game')
    await page.locator('input[type="radio"]').first().click()
    await page.waitForLoadState('networkidle')
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
    await expect(page.locator('nav')).toContainText('Solo Song')

    // Attempt to advance — pack is now exhausted, generateSong() returns null
    await page.getByRole('button', { name: 'Next Song' }).click()
    await page.waitForLoadState('networkidle')

    // No crash
    expect(errors).toHaveLength(0)
    // Nav bar still visible — page did not unmount
    await expect(page.locator('nav')).toBeVisible()
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

  test('menu closes after clicking a menu item', async ({ page }) => {
    // BUG: Before the fix, the #menu-toggle checkbox was never unchecked after an action
    // click, leaving the menu visually open.

    // Start a game so the game page (which has the hamburger) is shown
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="radio"]').first().click()
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()

    // Open the hamburger menu
    await page.click('label.hamburger')
    await expect(page.locator('.menu')).toBeVisible()

    // Click "Next Song" from inside the menu
    await page.locator('.menu').getByText('Next Song').click()
    await page.waitForLoadState('networkidle')

    // The checkbox must be unchecked
    const isChecked = await page.evaluate(() => {
      const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
      return toggle?.checked ?? true
    })
    expect(isChecked).toBe(false)
  })

  test('multiple sequential menu opens and closes work correctly', async ({ page }) => {
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="radio"]').first().click()
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()

    // First open/use
    await page.click('label.hamburger')
    await expect(page.locator('.menu')).toBeVisible()
    await page.locator('.menu').getByText('Next Song').click()
    await page.waitForLoadState('networkidle')
    let isChecked = await page.evaluate(() => {
      const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
      return toggle?.checked ?? true
    })
    expect(isChecked).toBe(false)

    // Second open/use — should work after the first close
    await page.click('label.hamburger')
    await expect(page.locator('.menu')).toBeVisible()
    await page.locator('.menu').getByText('Previous Song').click()
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
    // RISK 4.2: User deletes a song from song management while that song is actively
    // being played. The game page receives a null from getCurrentSong() and must
    // handle it gracefully rather than throwing.
    await seedTwoSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Start a game — song 1 ("First Song") is current
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="radio"]').first().click()
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()

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

    // Navigate away and back to /game to trigger a re-load of the current song
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    // No JS exceptions — the app must not crash
    expect(errors).toHaveLength(0)
    // Nav bar still visible — React tree is intact
    await expect(page.locator('nav')).toBeVisible()
  })

  test('deleting the active pack then returning to game does not crash', async ({ page }) => {
    // RISK 4.3: User deletes the entire pack that is currently selected for the game.
    // generateSong() will return null; the game page must not crash.
    await seedTwoSongPack(page)

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Start a game with pack 1
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="radio"]').first().click()
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()

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

    // Attempt to advance song — this calls generateSong() which now can't find the pack
    await page.getByRole('button', { name: 'Next Song' }).click()
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    await expect(page.locator('nav')).toBeVisible()
  })
})
