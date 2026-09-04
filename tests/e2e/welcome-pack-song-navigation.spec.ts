import { test } from '@playwright/test'
import { expect, pianoBingoLocator } from '../support/locators'

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

// ─── Welcome Page ─────────────────────────────────────────────────────────────

test.describe('Welcome Page', () => {
  test('shows the welcome page with logo on load', async ({ page }) => {
    await clearAndSeedPacks(page)

    await expect(page.locator('#logo')).toBeVisible()
    const app = pianoBingoLocator(page)
    await expect(app.welcomePage()).toBeVisible()
  })

  test('shows all action buttons', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

      const welcome = app.welcomePage()
      await expect(welcome.action('new-game')).toBeVisible()
      await expect(welcome.action('manage-songs')).toBeVisible()
      await expect(welcome.action('manage-playlists')).toBeVisible()
  })

  test('"New Game" navigates to pack select', async ({ page }) => {
    await clearAndSeedPacks(page, [{ packId: 1, packName: 'My Pack' }])
    const app = pianoBingoLocator(page)

    await app.welcomePage().action('new-game').click()
    await page.waitForLoadState('networkidle')

    await expect(app.packSelectPage()).toBeVisible()
  })

  test('"Manage Songs" navigates to song management', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await app.welcomePage().action('manage-songs').click()
    await page.waitForLoadState('networkidle')

    await expect(app.songManagementPage()).toBeVisible()
  })

  test('"Manage Playlists" navigates to pack management', async ({ page }) => {
    await clearAndSeedPacks(page)
    const app = pianoBingoLocator(page)

    await app.welcomePage().action('manage-playlists').click()
    await page.waitForLoadState('networkidle')

    await expect(app.packManagementPage()).toBeVisible()
  })
})

// ─── Pack Select Page ─────────────────────────────────────────────────────────

test.describe('Pack Select Page', () => {
  async function goToPackSelect(page: any, packs: Array<{ packId: number; packName: string }> = []) {
    await clearAndSeedPacks(page, packs)
    const app = pianoBingoLocator(page)
    await app.welcomePage().action('new-game').click()
    await page.waitForLoadState('networkidle')
  }

  test('shows pack select page with header and start button', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

      const packSelect = app.packSelectPage()
      await expect(packSelect).toBeVisible()
      await expect(packSelect.header()).toBeVisible()
      await expect(packSelect.startGameButton()).toBeVisible()
      await expect(packSelect.list()).toBeVisible()
  })

  test('auto-selects first pack when only one pack exists', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    const firstOption = app.packSelectPage().option(1)
    await expect(firstOption).toBeChecked()
  })

  test('auto-selects first pack when multiple packs exist', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'Pack A' },
      { packId: 2, packName: 'Pack B' },
    ])
    const app = pianoBingoLocator(page)

      const packSelect = app.packSelectPage()
      await expect(packSelect.option(1)).toBeChecked()
      await expect(packSelect.option(2)).not.toBeChecked()
  })

  test('renders one radio option per pack with correct labels', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'My Cool Pack' },
      { packId: 2, packName: 'Another Pack' },
    ])
    const app = pianoBingoLocator(page)

    await expect(app.packSelectPage().packRadioInputs()).toHaveCount(2)
    await expect(page.getByText('My Cool Pack')).toBeVisible()
    await expect(page.getByText('Another Pack')).toBeVisible()
  })

  test('clicking a pack radio option selects it', async ({ page }) => {
    await goToPackSelect(page, [
      { packId: 1, packName: 'Pack A' },
      { packId: 2, packName: 'Pack B' },
    ])
    const app = pianoBingoLocator(page)

      const packSelect = app.packSelectPage()
      await packSelect.option(2).click()

      await expect(packSelect.option(2)).toBeChecked()
      await expect(packSelect.option(1)).not.toBeChecked()
  })

  test('back button navigates back to welcome page', async ({ page }) => {
    await goToPackSelect(page, [{ packId: 1, packName: 'Pack A' }])
    const app = pianoBingoLocator(page)

    await app.packSelectPage().backButton().click()
    await page.waitForLoadState('networkidle')

    await expect(app.welcomePage()).toBeVisible()
  })

  test('shows no radio options when no packs exist', async ({ page }) => {
    await goToPackSelect(page, [])
    const app = pianoBingoLocator(page)

    await expect(app.packSelectPage().packRadioInputs()).toHaveCount(0)
  })
})

// ─── Song View Page ───────────────────────────────────────────────────────────

test.describe('Song View Page', () => {
  test('shows "No song selected" when navigating to a non-existent song id', async ({ page }) => {
    await clearAndSeedPacks(page)

    await page.goto('/song-view/9999')
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText('No song selected')
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText('No song selected')
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
    await app.welcomePage().action('manage-songs').click()
    await page.waitForLoadState('networkidle')
    await app.songManagementPage().action('view-song-1').click()
    await page.waitForLoadState('networkidle')

    await app.songViewPage().backButton().click()
    await page.waitForLoadState('networkidle')

    await expect(app.songManagementPage()).toBeVisible()
  })

  test('song view page shows song title in header', async ({ page }) => {
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
    await app.welcomePage().action('manage-songs').click()
    await page.waitForLoadState('networkidle')
    await app.songManagementPage().action('view-song-1').click()
    await page.waitForLoadState('networkidle')

    await expect(app.songViewPage()).toBeVisible()
  })
})
