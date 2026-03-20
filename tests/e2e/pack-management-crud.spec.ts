import { test, expect } from '@playwright/test'
import { pianoBingoLocator, pianoExpect } from '../support/locators'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const empty: unknown[] = []
    Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
    Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
  })
})

async function seedPacks(page: any, packs: Array<{ packId: number; packName: string }> = []) {
  await page.goto('/')
  await page.evaluate(async (seedData: Array<{ packId: number; packName: string }>) => {
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
          tx.objectStore('packs').put({ ...pack, songs: [], version: 1 })
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, packs)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function navigateToPackManagement(page: any) {
  const app = pianoBingoLocator(page)
  await app.pageWelcome().action('manage-playlists').click()
  await page.waitForLoadState('networkidle')
}

test.describe('Pack Management Page', () => {
  test.describe('Page load and navigation', () => {
    test('navigates to pack management from welcome page', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'Test Pack' }])

      await navigateToPackManagement(page)

      await pianoExpect(app.pagePackManagement()).toBeVisible()
      await pianoExpect(app.pagePackManagement().header()).toBeVisible()
      await pianoExpect(app.pagePackManagement().list()).toBeVisible()
    })

    test('back button navigates to welcome page', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'Test Pack' }])

      await navigateToPackManagement(page)

      await app.pagePackManagement().backButton().click()
      await page.waitForLoadState('networkidle')

      await pianoExpect(app.pageWelcome()).toBeVisible()
    })
  })

  test.describe('Displaying packs', () => {
    test('seeded packs appear as rows with their names', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [
        { packId: 1, packName: 'Alpha Pack' },
        { packId: 2, packName: 'Beta Pack' },
        { packId: 3, packName: 'Gamma Pack' },
      ])

      await navigateToPackManagement(page)

      await pianoExpect(app.pagePackManagement().row(1)).toBeVisible()
      await pianoExpect(app.pagePackManagement().row(2)).toBeVisible()
      await pianoExpect(app.pagePackManagement().row(3)).toBeVisible()

      await expect(app.pagePackManagement().nameInput(1).locate()).toHaveValue('Alpha Pack')
      await expect(app.pagePackManagement().nameInput(2).locate()).toHaveValue('Beta Pack')
      await expect(app.pagePackManagement().nameInput(3).locate()).toHaveValue('Gamma Pack')
    })

    test('empty list when no packs exist', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [])

      await navigateToPackManagement(page)

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(0)
    })
  })

  test.describe('Creating packs', () => {
    test('clicking create-pack adds a new row to the list', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'Existing Pack' }])

      await navigateToPackManagement(page)

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(1)

      await app.pagePackManagement().action('create-pack').click()
      await page.waitForLoadState('networkidle')

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(2)
    })
  })

  test.describe('Renaming packs', () => {
    test('renames a pack when editing the input and pressing Tab', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'Original Name' }])

      await navigateToPackManagement(page)

      await expect(app.pagePackManagement().nameInput(1).locate()).toHaveValue('Original Name')

      await app.pagePackManagement().nameInput(1).fill('New Pack Name')
      await app.pagePackManagement().nameInput(1).press('Tab')
      await page.waitForLoadState('networkidle')

      await expect(app.pagePackManagement().nameInput(1).locate()).toHaveValue('New Pack Name')
    })
  })

  test.describe('Deleting packs', () => {
    test('clicking delete removes that pack row', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [
        { packId: 1, packName: 'Pack to Delete' },
        { packId: 2, packName: 'Pack to Keep' },
      ])

      await navigateToPackManagement(page)

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(2)

      await app.pagePackManagement().action('delete-pack-1').click()
      await page.waitForLoadState('networkidle')

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(1)
      await pianoExpect(app.pagePackManagement().row(2)).toBeVisible()
    })

    test('deleting the last pack leaves an empty list', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'Only Pack' }])

      await navigateToPackManagement(page)

      await app.pagePackManagement().action('delete-pack-1').click()
      await page.waitForLoadState('networkidle')

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(0)
    })
  })

  test.describe('Navigating to pack edit', () => {
    test('clicking edit navigates to pack edit page', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [{ packId: 1, packName: 'My Pack' }])

      await navigateToPackManagement(page)

      await app.pagePackManagement().action('edit-pack-1').click()
      await page.waitForLoadState('networkidle')

      await pianoExpect(app.pagePackEdit()).toBeVisible()
    })
  })

  test.describe('Edge cases', () => {
    test('create then immediately delete leaves list consistent', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedPacks(page, [
        { packId: 1, packName: 'First Pack' },
        { packId: 2, packName: 'Second Pack' },
      ])

      await navigateToPackManagement(page)

      await app.pagePackManagement().action('create-pack').click()
      await page.waitForLoadState('networkidle')

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(3)

      // Find the newly created pack id (not 1 or 2)
      const newPackId = await page.evaluate(async (): Promise<number> => {
        return new Promise((resolve) => {
          const req = indexedDB.open('PianoBingoDB', 1)
          req.onsuccess = () => {
            const db = req.result
            const tx = db.transaction('packs', 'readonly')
            tx.objectStore('packs').getAll().onsuccess = (e: any) => {
              const all = e.target.result as Array<{ packId: number }>
              const found = all.find((p) => p.packId !== 1 && p.packId !== 2)
              db.close()
              resolve(found ? found.packId : 3)
            }
          }
        })
      })

      await app.pagePackManagement().action(`delete-pack-${newPackId}`).click()
      await page.waitForLoadState('networkidle')

      await expect(
        app.pagePackManagement().locate().locator('[data-testid^="row-"]')
      ).toHaveCount(2)
      await pianoExpect(app.pagePackManagement().row(1)).toBeVisible()
      await pianoExpect(app.pagePackManagement().row(2)).toBeVisible()
    })
  })
})
