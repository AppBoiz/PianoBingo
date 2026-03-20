import { test, expect } from '@playwright/test'
import path from 'path'
import { pianoBingoLocator, pianoExpect } from './support/locators'

const pdfPath = path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const empty: unknown[] = []
    Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
    Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
  })
})

async function seedSongs(
  page: any,
  songs: Array<{ songId: number; title: string; pdfUrl: string | null }> = []
) {
  await page.goto('/')
  await page.evaluate(async (seedData: Array<{ songId: number; title: string; pdfUrl: string | null }>) => {
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
        seedData.forEach((song) => {
          tx.objectStore('songs').put({ ...song, version: 1 })
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, songs)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function navigateToSongManagement(page: any) {
  const app = pianoBingoLocator(page)
  await app.pageWelcome().action('manage-songs').click()
  await page.waitForLoadState('networkidle')
}

test.describe('Song Management Page', () => {
  test.describe('Page load and navigation', () => {
    test('navigates to song management from welcome page', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement()).toBeVisible()
    })

    test('shows header with "Manage Songs" title', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().header()).toBeVisible()
      await expect(app.pageSongManagement().header().locate()).toContainText('Manage Songs')
    })

    test('shows "New Song" button in footer', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().primaryAction()).toBeVisible()
      await expect(app.pageSongManagement().primaryAction().locate()).toContainText('New Song')
    })

    test('back button navigates back to welcome page', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)
      await app.pageSongManagement().backButton().click()
      await page.waitForLoadState('networkidle')

      await pianoExpect(app.pageWelcome()).toBeVisible()
    })
  })

  test.describe('Displaying songs', () => {
    test('shows empty list when no songs exist', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const rows = app.pageSongManagement().locate().locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(0)
    })

    test('displays song rows for each song', async ({ page }) => {
      await seedSongs(page, [
        { songId: 1, title: 'Song One', pdfUrl: null },
        { songId: 2, title: 'Song Two', pdfUrl: null },
      ])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().row(1)).toBeVisible()
      await pianoExpect(app.pageSongManagement().row(2)).toBeVisible()
    })

    test('song with PDF shows view and remove-pdf buttons', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'With PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().action(`view-song-1`)).toBeVisible()
      await pianoExpect(app.pageSongManagement().action(`remove-pdf-1`)).toBeVisible()
    })

    test('song without PDF shows upload label instead of view/remove', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().bySongUploadInput(1)).toBeAttached()
      await expect(app.pageSongManagement().action(`view-song-1`).locate()).not.toBeVisible()
      await expect(app.pageSongManagement().action(`remove-pdf-1`).locate()).not.toBeVisible()
    })

    test('delete button is always visible for each song', async ({ page }) => {
      await seedSongs(page, [
        { songId: 1, title: 'Song A', pdfUrl: null },
        { songId: 2, title: 'Song B', pdfUrl: 'data:application/pdf;base64,abc' },
      ])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().action(`delete-song-1`)).toBeVisible()
      await pianoExpect(app.pageSongManagement().action(`delete-song-2`)).toBeVisible()
    })
  })

  test.describe('Creating songs', () => {
    test('creates a new song row when "New Song" button is clicked', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().primaryAction().click()
      await page.waitForLoadState('networkidle')

      const rows = app.pageSongManagement().locate().locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(1)
    })

    test('newly created song has no PDF — shows upload input', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().primaryAction().click()
      await page.waitForLoadState('networkidle')

      // Get the new song id from the first row's testid
      const firstRow = app.pageSongManagement().locate().locator('[data-testid^="row-"]').first()
      const testId = await firstRow.getAttribute('data-testid') ?? ''
      const newSongId = parseInt(testId.replace('row-', ''), 10)

      await pianoExpect(app.pageSongManagement().bySongUploadInput(newSongId)).toBeAttached()
    })

    test('creating multiple songs increases the row count', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().primaryAction().click()
      await page.waitForURL('**')
      await app.pageSongManagement().primaryAction().click()
      await page.waitForTimeout(300)

      const rows = app.pageSongManagement().locate().locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(2)
    })
  })

  test.describe('Deleting songs', () => {
    test('deleting a song removes its row from the list', async ({ page }) => {
      await seedSongs(page, [
        { songId: 1, title: 'Song One', pdfUrl: null },
        { songId: 2, title: 'Song Two', pdfUrl: null },
      ])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('delete-song-1').click()
      await page.waitForTimeout(300)

      await expect(app.pageSongManagement().row(1).locate()).not.toBeVisible()
      await pianoExpect(app.pageSongManagement().row(2)).toBeVisible()
    })

    test('deleting last song leaves empty list', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Only Song', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('delete-song-1').click()
      await page.waitForTimeout(300)

      const rows = app.pageSongManagement().locate().locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(0)
    })
  })

  test.describe('Song PDF actions', () => {
    test('remove-pdf button removes pdf from song (upload input reappears)', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Has PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await pianoExpect(app.pageSongManagement().action('remove-pdf-1')).toBeVisible()
      await app.pageSongManagement().action('remove-pdf-1').click()
      await page.waitForTimeout(300)

      await pianoExpect(app.pageSongManagement().bySongUploadInput(1)).toBeAttached()
      await expect(app.pageSongManagement().action('view-song-1').locate()).not.toBeVisible()
    })

    test('view-song button navigates to song view page', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Has PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('.pdf-reader-empty, [data-testid="page-song-view"]')).toBeVisible()
    })

    test('upload PDF input accepts pdf files', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const input = app.pageSongManagement().bySongUploadInput(1).locate()
      const type = await input.getAttribute('type')
      const accept = await input.getAttribute('accept')

      expect(type).toBe('file')
      expect(accept).toContain('pdf')
    })

    test('uploading a PDF shows view and remove buttons', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().bySongUploadInput(1).locate().setInputFiles(pdfPath)
      await page.waitForTimeout(500)

      await pianoExpect(app.pageSongManagement().action('view-song-1')).toBeVisible()
      await pianoExpect(app.pageSongManagement().action('remove-pdf-1')).toBeVisible()
    })
  })

  test.describe('Navigation to song view', () => {
    test('view-song button for song with PDF navigates to song view', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Viewable Song', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      // SongView page container is always rendered when navigation succeeds
      await expect(page.locator('.pdf-reader-empty, [data-testid="page-song-view"]')).toBeVisible()
    })
  })
})
