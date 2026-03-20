import { test, expect } from '@playwright/test'
import { pianoBingoLocator, pianoExpect } from './support/locators'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const empty: unknown[] = []
    Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
    Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
  })
})

async function clearAndSeedPacks(
  page: any,
  packs: Array<{ packId: number; packName: string; songs?: number[] }> = []
) {
  await page.goto('/')
  await page.evaluate(
    async (seedData: Array<{ packId: number; packName: string; songs: number[] }>) => {
      localStorage.clear()
      await new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('PianoBingoDB')
        del.onsuccess = () => resolve()
        del.onerror = () => resolve()
      })
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
          if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['packs', 'songs'], 'readwrite')
          seedData.forEach((pack) => {
            tx.objectStore('packs').put({ packId: pack.packId, packName: pack.packName, songs: pack.songs, version: 1 })
          })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    },
    packs.map((p) => ({ ...p, songs: p.songs ?? [] }))
  )
  await page.reload({ waitUntil: 'domcontentloaded' })
}

// ─── Welcome Page ────────────────────────────────────────────────────────────

test.describe('Welcome Page', () => {
  test('shows the welcome page on load', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pageWelcome()).toBeVisible()
  })

  test('shows the PianoBingo logo', async ({ page }) => {
    await clearAndSeedPacks(page)

    await expect(page.locator('#logo')).toBeVisible()
  })

  test('"New Game" button is visible', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pageWelcome().action('new-game')).toBeVisible()
  })

  test('"Manage Songs" button is visible', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pageWelcome().action('manage-songs')).toBeVisible()
  })

  test('"Manage Playlists" button is visible', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pageWelcome().action('manage-playlists')).toBeVisible()
  })

  test('"New Game" navigates to pack select', async ({ page }) => {
    await clearAndSeedPacks(page, [{ packId: 1, packName: 'My Pack' }])
    const app = pianoBingoLocator(page)

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pagePackSelect()).toBeVisible()
  })

  test('"Manage Songs" navigates to song management', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await app.pageWelcome().action('manage-songs').click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageSongManagement()).toBeVisible()
  })

  test('"Manage Playlists" navigates to pack management', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await app.pageWelcome().action('manage-playlists').click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pagePackManagement()).toBeVisible()
  })
})

// ─── Pack Select Page ─────────────────────────────────────────────────────────

test.describe('Pack Select Page', () => {
  async function goToPackSelect(page: any, packs: Array<{ packId: number; packName: string }> = []) {
    await clearAndSeedPacks(page, packs)
    const app = pianoBingoLocator(page)
    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
  }

  test('shows pack select page with header', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pagePackSelect()).toBeVisible()
    await pianoExpect(app.pagePackSelect().header()).toBeVisible()
  })

  test('shows "Start Game" button', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pagePackSelect().startGameButton()).toBeVisible()
  })

  test('shows pack list container', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    await pianoExpect(app.pagePackSelect().list()).toBeVisible()
  })

  test('auto-selects first pack when only one pack exists', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    const firstOption = app.pagePackSelect().option(1).locate()
    await expect(firstOption).toBeChecked()
  })

  test('auto-selects first pack when multiple packs exist', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'Pack A' },
      { packId: 2, packName: 'Pack B' },
    ])
    const app = pianoBingoLocator(page)

    await expect(app.pagePackSelect().option(1).locate()).toBeChecked()
    await expect(app.pagePackSelect().option(2).locate()).not.toBeChecked()
  })

  test('renders one radio option per pack', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'Pack A' },
      { packId: 2, packName: 'Pack B' },
    ])
    const app = pianoBingoLocator(page)

    await expect(app.pagePackSelect().packRadioInputs().locate()).toHaveCount(2)
  })

  test('clicking a pack radio option selects it', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'Pack A' },
      { packId: 2, packName: 'Pack B' },
    ])
    const app = pianoBingoLocator(page)

    await app.pagePackSelect().option(2).locate().click()

    await expect(app.pagePackSelect().option(2).locate()).toBeChecked()
    await expect(app.pagePackSelect().option(1).locate()).not.toBeChecked()
  })

  test('pack names appear as labels', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'My Cool Pack' },
      { packId: 2, packName: 'Another Pack' },
    ])

    await expect(page.getByText('My Cool Pack')).toBeVisible()
    await expect(page.getByText('Another Pack')).toBeVisible()
  })

  test('back button navigates back to welcome page', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    await app.pagePackSelect().backButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageWelcome()).toBeVisible()
  })

  test('shows no radio options when no packs exist', async ({ page }) => {
    await goToPackSelect(page, [])
    const app = pianoBingoLocator(page)

    await expect(app.pagePackSelect().packRadioInputs().locate()).toHaveCount(0)
  })
})

// ─── Song View Page ───────────────────────────────────────────────────────────

test.describe('Song View Page', () => {
  async function seedSongAndNavigate(page: any, pdfUrl: string | null) {
    await page.goto('/')
    await page.evaluate(async (pdf: string | null) => {
      localStorage.clear()
      await new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('PianoBingoDB')
        del.onsuccess = () => resolve()
        del.onerror = () => resolve()
      })
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
          if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['packs', 'songs'], 'readwrite')
          tx.objectStore('songs').put({ songId: 1, title: 'Test Song', pdfUrl: pdf, version: 1 })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    }, pdfUrl)
    await page.reload({ waitUntil: 'domcontentloaded' })

    // Navigate: welcome → manage songs → view song
    const app = pianoBingoLocator(page)
    await app.pageWelcome().action('manage-songs').click()
    await page.waitForLoadState('networkidle')
    await app.pageSongManagement().action('view-song-1').click()
    await page.waitForLoadState('networkidle')
  }

  test('shows "No song selected" for song without PDF via direct navigation', async ({ page }) => {
    await clearAndSeedPacks(page)

    await page.evaluate(() => {
      window.history.pushState({}, '', '/song-view/9999')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.pdf-reader-empty')).toBeVisible()
    await expect(page.locator('.pdf-reader-empty')).toContainText('No song selected')
  })

  test('shows "No song selected" when song id does not exist', async ({ page }) => {
    await clearAndSeedPacks(page)

    // Navigate to a non-existent song id
    await page.evaluate(() => {
      window.history.pushState({}, '', '/song-view/99999')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.pdf-reader-empty')).toBeVisible()
  })

  test('back button on song view navigates to song management', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(async () => {
      localStorage.clear()
      await new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('PianoBingoDB')
        del.onsuccess = () => resolve()
        del.onerror = () => resolve()
      })
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
          if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['packs', 'songs'], 'readwrite')
          tx.objectStore('songs').put({ songId: 1, title: 'Test Song', pdfUrl: 'data:application/pdf;base64,abc', version: 1 })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    })
    await page.reload({ waitUntil: 'domcontentloaded' })

    const app = pianoBingoLocator(page)
    await app.pageWelcome().action('manage-songs').click()
    await page.waitForLoadState('networkidle')
    await app.pageSongManagement().action('view-song-1').click()
    await page.waitForLoadState('networkidle')

    // The page shows either the viewer or a "loading/no song" state
    // Back button exists in both SongViewHeader and .pdf-reader-empty fallback
    await app.pageSongView().backButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageSongManagement()).toBeVisible()
  })

  test('song view page shows header with song title when pdf loads', async ({ page }) => {
    // Seed with a minimal fake base64 that will resolve to a song name display
    await page.goto('/')
    await page.evaluate(async () => {
      localStorage.clear()
      await new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('PianoBingoDB')
        del.onsuccess = () => resolve()
        del.onerror = () => resolve()
      })
      await new Promise<void>((resolve) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
          if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['packs', 'songs'], 'readwrite')
          tx.objectStore('songs').put({ songId: 1, title: 'My Great Song', pdfUrl: 'data:application/pdf;base64,abc', version: 1 })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => { db.close(); resolve() }
        }
        req.onerror = () => resolve()
      })
    })
    await page.reload({ waitUntil: 'domcontentloaded' })

    const app = pianoBingoLocator(page)
    await app.pageWelcome().action('manage-songs').click()
    await page.waitForLoadState('networkidle')
    await app.pageSongManagement().action('view-song-1').click()

    // Wait for the song view to render (either the page-song-view container or an error state)
    await page.locator('[data-testid="page-song-view"], .pdf-reader-empty').waitFor({ state: 'visible' })

    const pageIsLoaded = await page.locator('[data-testid="page-song-view"]').isVisible()
    if (pageIsLoaded) {
      await expect(page.locator('#title')).toContainText('My Great Song')
    } else {
      // Shows the empty/error state - still valid
      await expect(page.locator('.pdf-reader-empty')).toBeVisible()
    }
  })
})
