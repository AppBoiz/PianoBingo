import { test } from '@playwright/test'
import path from 'path'
import { expect, pianoBingoLocator } from '../support/locators'

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

      await expect(app.pageSongManagement()).toBeVisible()
    })

    test('shows header with "Manage Songs" title', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.header()).toBeVisible()
      await expect(songMgmt.header()).toContainText('Manage Songs')
    })

    test('shows "New Song" button in footer', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.primaryAction()).toBeVisible()
      await expect(songMgmt.primaryAction()).toContainText('New Song')
    })

    test('back button navigates back to welcome page', async ({ page }) => {
      await seedSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)
      await app.pageSongManagement().backButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageWelcome()).toBeVisible()
    })
  })

  test.describe('Displaying songs', () => {
    test('shows empty list when no songs exist', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const rows = app.pageSongManagement().locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(0)
    })

    test('displays song rows for each song', async ({ page }) => {
      await seedSongs(page, [
        { songId: 1, title: 'Song One', pdfUrl: null },
        { songId: 2, title: 'Song Two', pdfUrl: null },
      ])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.row(1)).toBeVisible()
      await expect(songMgmt.row(2)).toBeVisible()
    })

    test('song with PDF shows view and remove-pdf buttons', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'With PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.action('view-song-1')).toBeVisible()
      await expect(songMgmt.action('remove-pdf-1')).toBeVisible()
    })

    test('song without PDF shows upload input instead of view/remove buttons', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.bySongUploadInput(1)).toBeAttached()
      await expect(songMgmt.action('view-song-1')).not.toBeVisible()
      await expect(songMgmt.action('remove-pdf-1')).not.toBeVisible()
    })
  })

  test.describe('Creating songs', () => {
    test('creates a new song row when "New Song" button is clicked', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().primaryAction().click()
      await page.waitForLoadState('networkidle')

      const songMgmt = app.pageSongManagement()
      const rows = songMgmt.locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(1)
    })

    test('newly created song has no PDF — shows upload input', async ({ page }) => {
      await seedSongs(page, [])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().primaryAction().click()
      await page.waitForLoadState('networkidle')

      const songMgmt = app.pageSongManagement()
      const firstRow = songMgmt.locator('[data-testid^="row-"]').first()
      const testId = await firstRow.getAttribute('data-testid') ?? ''
      const newSongId = parseInt(testId.replace('row-', ''), 10)

      await expect(songMgmt.bySongUploadInput(newSongId)).toBeAttached()
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

      const songMgmt = app.pageSongManagement()
      await songMgmt.action('delete-song-1').click()

      await expect(songMgmt.row(1)).not.toBeVisible()
      await expect(songMgmt.row(2)).toBeVisible()
    })

    test('deleting last song leaves empty list', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Only Song', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('delete-song-1').click()

      const songMgmt = app.pageSongManagement()
      const rows = songMgmt.locator('[data-testid^="row-"]')
      await expect(rows).toHaveCount(0)
    })
  })

  test.describe('Song PDF actions', () => {
    test('remove-pdf button removes PDF from song (upload input reappears)', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Has PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await expect(songMgmt.action('remove-pdf-1')).toBeVisible()
      await songMgmt.action('remove-pdf-1').click()

      await expect(songMgmt.bySongUploadInput(1)).toBeAttached()
      await expect(songMgmt.action('view-song-1')).not.toBeVisible()
    })

    test('upload PDF input accepts pdf files', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const input = app.pageSongManagement().bySongUploadInput(1)
      const type = await input.getAttribute('type')
      const accept = await input.getAttribute('accept')

      expect(type).toBe('file')
      expect(accept).toContain('pdf')
    })

    test('uploading a PDF shows view and remove buttons', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'No PDF', pdfUrl: null }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      const songMgmt = app.pageSongManagement()
      await songMgmt.bySongUploadInput(1).setInputFiles(pdfPath)

      await expect(songMgmt.action('view-song-1')).toBeVisible()
      await expect(songMgmt.action('remove-pdf-1')).toBeVisible()
    })

    test('view-song button navigates to song view page', async ({ page }) => {
      await seedSongs(page, [{ songId: 1, title: 'Has PDF', pdfUrl: 'data:application/pdf;base64,abc' }])
      const app = pianoBingoLocator(page)

      await navigateToSongManagement(page)

      await app.pageSongManagement().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('.pdf-reader-empty, [data-testid="page-song-view"]')).toBeVisible()
    })
  })
})
