import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { expect, pianoBingoLocator } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const empty: unknown[] = []
    Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
    Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
  })
})

async function seedPackWithSongs(page: any) {
  await page.goto('/')
  await page.evaluate(async (pdfB64: string) => {
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
        tx.objectStore('packs').put({ packId: 1, packName: 'Test Pack', songs: [1], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Song One', pdfUrl: pdfB64, version: 1 })
        tx.objectStore('songs').put({ songId: 2, title: 'Song Two', pdfUrl: pdfB64, version: 1 })
        tx.objectStore('songs').put({ songId: 3, title: 'Song Three', pdfUrl: pdfB64, version: 1 })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function navigateToPackEdit(page: any) {
  const app = pianoBingoLocator(page)
  await app.welcomePage().action('manage-playlists').click()
  await page.waitForLoadState('networkidle')
  await app.packManagementPage().action('edit-pack-1').click()
  await page.waitForLoadState('networkidle')
}

test.describe('Pack Edit Page', () => {
  test.describe('Page load and navigation', () => {
    test('loads with header, song list and save button', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit).toBeVisible()
      await expect(packEdit.header()).toBeVisible()
      await expect(packEdit.list()).toBeVisible()
      await expect(packEdit.primaryAction()).toBeVisible()
    })

    test('back button navigates back to pack management', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await app.packEditPage().backButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.packManagementPage()).toBeVisible()
    })

    test('shows "Pack not found" for a non-existent pack id', async ({ page }) => {
      await seedPackWithSongs(page)

      await page.goto('/')
      await page.evaluate(() => {
        window.history.pushState({}, '', '/pack-edit/9999')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toContainText('Pack not found')
    })
  })

  test.describe('Song selection state', () => {
    test('song in pack appears selected, others appear unselected', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      // Song 1 is in pack — should NOT have 'unchecked' class
      await expect(packEdit.row(1)).not.toHaveClass(/unchecked/)
      // Songs 2 and 3 are not in pack — should have 'unchecked' class
      await expect(packEdit.row(2)).toHaveClass(/unchecked/)
      await expect(packEdit.row(3)).toHaveClass(/unchecked/)
    })

    test('song in pack shows its position number in the handle', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const handle = app.packEditPage().row(1).getByTestId('handle')
      await expect(handle).toContainText('1')
    })

    test('songs display their titles', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit.row(1).getByTestId('name')).toContainText('Song One')
      await expect(packEdit.row(2).getByTestId('name')).toContainText('Song Two')
      await expect(packEdit.row(3).getByTestId('name')).toContainText('Song Three')
    })
  })

  test.describe('Toggling song selection', () => {
    test('clicking an unselected row adds it to the pack', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit.row(2)).toHaveClass(/unchecked/)
      await packEdit.row(2).click()
      await expect(packEdit.row(2)).not.toHaveClass(/unchecked/)

      await expect(page.locator('#song-counter')).toContainText('2/75')
    })

    test('clicking a selected row removes it from the pack', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit.row(1)).not.toHaveClass(/unchecked/)
      await packEdit.row(1).click()
      await expect(packEdit.row(1)).toHaveClass(/unchecked/)

      await expect(page.locator('#song-counter')).toContainText('0/75')
    })

    test('toggling multiple songs updates the counter correctly', async ({ page }) => {
      await seedPackWithSongs(page)

      await navigateToPackEdit(page)

      const counter = page.locator('#song-counter')
      await expect(counter).toContainText('1/75')

      const app = pianoBingoLocator(page)
      const packEdit = app.packEditPage()
      await packEdit.row(2).click()
      await expect(counter).toContainText('2/75')

      await packEdit.row(3).click()
      await expect(counter).toContainText('3/75')

      await packEdit.row(1).click()
      await expect(counter).toContainText('2/75')
    })

    test('clicking the checkbox inside a row toggles the song', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      const checkbox2 = packEdit.row(2).getByTestId('checkbox')
      await checkbox2.click()

      await expect(packEdit.row(2)).not.toHaveClass(/unchecked/)
      await expect(page.locator('#song-counter')).toContainText('2/75')
    })
  })

  test.describe('Song counter and save button', () => {
    test('save button is disabled and labelled "Ok" when pack has fewer than 75 songs', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit.primaryAction()).toBeDisabled()
      await expect(packEdit.primaryAction()).toContainText('Ok')
    })
  })
})
