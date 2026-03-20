import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { pianoBingoLocator, pianoExpect } from './support/locators'

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
  await app.pageWelcome().action('manage-playlists').click()
  await page.waitForLoadState('networkidle')
  await app.pagePackManagement().action('edit-pack-1').click()
  await page.waitForLoadState('networkidle')
}

test.describe('Pack Edit Page', () => {
  test.describe('Page load and navigation', () => {
    test('loads with header, song list and save button', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await pianoExpect(app.pagePackEdit()).toBeVisible()
      await pianoExpect(app.pagePackEdit().header()).toBeVisible()
      await pianoExpect(app.pagePackEdit().list()).toBeVisible()
      await pianoExpect(app.pagePackEdit().primaryAction()).toBeVisible()
    })

    test('back button navigates back to pack management', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await app.pagePackEdit().backButton().click()
      await page.waitForLoadState('networkidle')

      await pianoExpect(app.pagePackManagement()).toBeVisible()
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

      // Song 1 is in pack — should NOT have 'unchecked' class
      await expect(app.pagePackEdit().row(1).locate()).not.toHaveClass(/unchecked/)
      // Songs 2 and 3 are not in pack — should have 'unchecked' class
      await expect(app.pagePackEdit().row(2).locate()).toHaveClass(/unchecked/)
      await expect(app.pagePackEdit().row(3).locate()).toHaveClass(/unchecked/)
    })

    test('song in pack shows its position number in the handle', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const handle = app.pagePackEdit().row(1).locate().getByTestId('handle')
      await expect(handle).toContainText('1')
    })

    test('songs display their titles', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await expect(app.pagePackEdit().row(1).locate().getByTestId('name')).toContainText('Song One')
      await expect(app.pagePackEdit().row(2).locate().getByTestId('name')).toContainText('Song Two')
      await expect(app.pagePackEdit().row(3).locate().getByTestId('name')).toContainText('Song Three')
    })
  })

  test.describe('Toggling song selection', () => {
    test('clicking an unselected row adds it to the pack', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await expect(app.pagePackEdit().row(2).locate()).toHaveClass(/unchecked/)
      await app.pagePackEdit().row(2).locate().click()
      await expect(app.pagePackEdit().row(2).locate()).not.toHaveClass(/unchecked/)

      await expect(page.locator('#song-counter')).toContainText('2/75')
    })

    test('clicking a selected row removes it from the pack', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await expect(app.pagePackEdit().row(1).locate()).not.toHaveClass(/unchecked/)
      await app.pagePackEdit().row(1).locate().click()
      await expect(app.pagePackEdit().row(1).locate()).toHaveClass(/unchecked/)

      await expect(page.locator('#song-counter')).toContainText('0/75')
    })

    test('toggling multiple songs updates the counter correctly', async ({ page }) => {
      await seedPackWithSongs(page)

      await navigateToPackEdit(page)

      const counter = page.locator('#song-counter')
      await expect(counter).toContainText('1/75')

      const app = pianoBingoLocator(page)
      await app.pagePackEdit().row(2).locate().click()
      await expect(counter).toContainText('2/75')

      await app.pagePackEdit().row(3).locate().click()
      await expect(counter).toContainText('3/75')

      await app.pagePackEdit().row(1).locate().click()
      await expect(counter).toContainText('2/75')
    })

    test('clicking the checkbox inside a row toggles the song', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const checkbox2 = app.pagePackEdit().row(2).locate().getByTestId('checkbox')
      await checkbox2.click()

      await expect(app.pagePackEdit().row(2).locate()).not.toHaveClass(/unchecked/)
      await expect(page.locator('#song-counter')).toContainText('2/75')
    })

    test('adding song increments position number in handle', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await app.pagePackEdit().row(2).locate().click()

      const handle2 = app.pagePackEdit().row(2).locate().getByTestId('handle')
      await expect(handle2).toContainText('2')
    })
  })

  test.describe('Song counter and save button', () => {
    test('initial counter shows 1/75 for pack with one song', async ({ page }) => {
      await seedPackWithSongs(page)

      await navigateToPackEdit(page)

      await expect(page.locator('#song-counter')).toHaveText('1/75')
    })

    test('save button is disabled when pack has fewer than 75 songs', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await expect(app.pagePackEdit().primaryAction().locate()).toBeDisabled()
    })

    test('save button shows "Ok" label', async ({ page }) => {
      await seedPackWithSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      await pianoExpect(app.pagePackEdit().primaryAction()).toContainText('Ok')
    })
  })
})
