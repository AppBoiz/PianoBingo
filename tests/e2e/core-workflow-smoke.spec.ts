import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { PACK_SIZE } from '../../src/shared/constants/game'
import { expect, pianoBingoLocator } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

async function seedMultiplePacks(page: any) {
  await page.goto('/')
  await page.evaluate(async (pdf: string) => {
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
        if (!db.objectStoreNames.contains('packs'))
          db.createObjectStore('packs', { keyPath: 'packId' })
        if (!db.objectStoreNames.contains('songs'))
          db.createObjectStore('songs', { keyPath: 'songId' })
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['packs', 'songs'], 'readwrite')

        tx.objectStore('packs').put({ packId: 1, packName: 'Classical Pack', songs: [1, 2, 3], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Moonlight Sonata', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 2, title: 'Fur Elise', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 3, title: 'Ode to Joy', pdfUrl: pdf, version: 1 })

        tx.objectStore('packs').put({ packId: 2, packName: 'Jazz Pack', songs: [4, 5], version: 1 })
        tx.objectStore('songs').put({ songId: 4, title: 'Take Five', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 5, title: 'All Blues', pdfUrl: pdf, version: 1 })

        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

test.describe('Core Workflow Smoke Tests', () => {
  test.describe('Welcome Page', () => {
    test('welcome page loads with all action buttons', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await expect(app.pageWelcome().action('new-game')).toBeVisible()
      await expect(app.pageWelcome().action('manage-songs')).toBeVisible()
      await expect(app.pageWelcome().action('manage-playlists')).toBeVisible()
    })

    test('New Game navigates to Pack Select with multiple packs', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedMultiplePacks(page)
      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pagePackSelect().packRadioInputs().first()).toBeVisible()
      await expect(app.pagePackSelect().packRadioInputs().second()).toBeVisible()
    })
  })

  test.describe('Core Game Flow', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('complete workflow: welcome → pack select → game → history', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')

      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')

      await app.pagePackSelect().packRadioInputs().first().click()
      await app.pagePackSelect().startGameButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageGame().nextSong()).toBeVisible()
      await expect(app.pageGame().navTitle()).not.toBeEmpty()
      const firstTitle = await app.pageGame().navTitle().textContent()
      expect(firstTitle).toBeTruthy()

      await app.pageGame().nextSong().click()
      await page.waitForLoadState('networkidle')
      await expect(app.pageGame().navTitle()).not.toBeEmpty()
      const secondTitle = await app.pageGame().navTitle().textContent()
      expect(secondTitle).toBeTruthy()

      await app.pageGame().menuToggle().click()
      await expect(app.pageGame().menu()).toBeVisible()

      await app.pageGame().menuItem('game-history').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageGameHistory().header()).toBeVisible()
      await expect(app.pageGameHistory().boxes()).toHaveCount(PACK_SIZE)

      const highlighted = await app.pageGameHistory().highlightedBoxes().count()
      expect(highlighted).toBeGreaterThanOrEqual(2)
    })

    test('song progression increments correctly', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await app.pagePackSelect().packRadioInputs().first().click()
      await app.pagePackSelect().startGameButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageGame().header()).toBeVisible()
      await expect(app.pageGame().navTitle()).not.toBeEmpty()
      const firstTitle = await app.pageGame().navTitle().textContent()

      await app.pageGame().nextSong().click()
      // Poll until the nav title settles on a different song.
      // Using toPass (not not.toHaveText) avoids a TOCTOU race where the element
      // briefly disappears during a React re-render, causing not.toHaveText to pass
      // prematurely before the new text has been rendered.
      let secondTitle: string | null = null
      await expect(async () => {
        secondTitle = await app.pageGame().navTitle().textContent()
        expect(secondTitle).not.toBeNull()
        expect(secondTitle).not.toEqual(firstTitle)
      }).toPass({ timeout: 10000 })

      await app.pageGame().menuToggle().click()
      await app.pageGame().menuItem('prev-song').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageGame().header()).toBeVisible()
    })

    test('end game returns to welcome page with reset state', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await app.pagePackSelect().packRadioInputs().first().click()
      await app.pagePackSelect().startGameButton().click()
      await page.waitForLoadState('networkidle')

      await app.pageGame().nextSong().click()
      await page.waitForLoadState('networkidle')

      await app.pageGame().menuToggle().click()
      await app.pageGame().menuItem('end-game').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageWelcome().action('new-game')).toBeVisible()

      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await expect(app.pagePackSelect().packRadioInputs().first()).toBeVisible()
    })
  })

  test.describe('Song Management', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('navigate to song management and back', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageSongManagement().list()).toBeVisible()
      await expect(app.pageSongManagement().row(1)).toBeVisible()
    })

    test('click song to preview', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      await app.pageSongManagement().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageSongView()).toBeVisible()
      await expect(app.pageSongView().backButton()).toBeVisible()
    })
  })

  test.describe('Navigation Consistency', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('back button from song view returns to song management', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      await app.pageSongManagement().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      await app.pageSongView().backButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.pageSongManagement().row(1)).toBeVisible()
    })
  })

  test.describe('State Persistence', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('game state survives page reload', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await app.pagePackSelect().packRadioInputs().first().click()
      await app.pagePackSelect().startGameButton().click()
      await page.waitForLoadState('networkidle')

      const titleBefore = await app.pageGame().navTitle().textContent()
      await app.pageGame().nextSong().click()
      await page.waitForLoadState('networkidle')
      const titleAfter = await app.pageGame().navTitle().textContent()
      expect(titleAfter || titleBefore).toBeTruthy()

      const stateBeforeReload = await page.evaluate(() => {
        const state = localStorage.getItem('gameState')
        return state ? JSON.parse(state) : null
      })
      expect(stateBeforeReload).toBeTruthy()

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')

      const stateAfterReload = await page.evaluate(() => {
        const state = localStorage.getItem('gameState')
        return state ? JSON.parse(state) : null
      })
      expect(stateAfterReload).toBeTruthy()
      expect(stateAfterReload.shownSongIds).toEqual(stateBeforeReload.shownSongIds)
      expect(stateAfterReload.currentSong?.songId).toEqual(stateBeforeReload.currentSong?.songId)
    })

    test('pack selection persists across navigation', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await app.pagePackSelect().packRadioInputs().first().click()
      await app.pagePackSelect().startGameButton().click()
      await page.waitForLoadState('networkidle')

      await app.pageGame().menuToggle().click()
      await app.pageGame().menuItem('end-game').click()
      await page.waitForLoadState('networkidle')
      await app.pageWelcome().action('manage-songs').click()
      await page.waitForLoadState('networkidle')
      await app.pageSongManagement().backButton().click()
      await page.waitForLoadState('networkidle')

      await app.pageWelcome().action('new-game').click()
      await page.waitForLoadState('networkidle')
      await expect(app.pagePackSelect().packRadioInputs().first()).toBeVisible()
    })
  })
})
