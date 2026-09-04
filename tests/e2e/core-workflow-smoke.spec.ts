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

      const welcome = app.welcomePage()
      await expect(welcome.action('new-game')).toBeVisible()
      await expect(welcome.action('manage-songs')).toBeVisible()
      await expect(welcome.action('manage-playlists')).toBeVisible()
    })

    test('New Game navigates to Pack Select with multiple packs', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await seedMultiplePacks(page)
      await app.welcomePage().action('new-game').click()
      await page.waitForLoadState('networkidle')

      const packSelect = app.packSelectPage()
      await expect(packSelect.packRadioInputs().first()).toBeVisible()
      await expect(packSelect.packRadioInputs().second()).toBeVisible()
    })
  })

  test.describe('Core Game Flow', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('complete workflow: welcome → pack select → game → history', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')

      await app.welcomePage().action('new-game').click()
      await page.waitForLoadState('networkidle')

      const packSelect = app.packSelectPage()
      await packSelect.packRadioInputs().first().click()
      await packSelect.startGameButton().click()
      await page.waitForLoadState('networkidle')

      const game = app.gamePage()
      await expect(game.nextSong()).toBeVisible()
      await expect(game.navTitle()).not.toBeEmpty()
      const firstTitle = await game.navTitle().textContent()
      expect(firstTitle).toBeTruthy()

      await game.nextSong().click()
      await page.waitForLoadState('networkidle')
      await expect(game.navTitle()).not.toBeEmpty()
      const secondTitle = await game.navTitle().textContent()
      expect(secondTitle).toBeTruthy()

      await game.menuToggle().click()
      await expect(game.menu()).toBeVisible()

      await game.menuItem('game-history').click()
      await page.waitForLoadState('networkidle')

      const gameHistory = app.gameHistoryPage()
      await expect(gameHistory.header()).toBeVisible()
      await expect(gameHistory.boxes()).toHaveCount(PACK_SIZE)

      const highlighted = await gameHistory.highlightedBoxes().count()
      expect(highlighted).toBeGreaterThanOrEqual(2)
    })

    test('song progression increments correctly', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.welcomePage().action('new-game').click()
      await page.waitForLoadState('networkidle')
      const packSelect = app.packSelectPage()
      await packSelect.packRadioInputs().first().click()
      await packSelect.startGameButton().click()
      await page.waitForLoadState('networkidle')

      const game = app.gamePage()
      await expect(game.header()).toBeVisible()
      await expect(game.navTitle()).not.toBeEmpty()
      const firstTitle = await game.navTitle().textContent()

      await game.nextSong().click()
      // Poll until the nav title settles on a different song.
      // Using toPass (not not.toHaveText) avoids a TOCTOU race where the element
      // briefly disappears during a React re-render, causing not.toHaveText to pass
      // prematurely before the new text has been rendered.
      let secondTitle: string | null = null
      await expect(async () => {
        secondTitle = await game.navTitle().textContent()
        expect(secondTitle).not.toBeNull()
        expect(secondTitle).not.toEqual(firstTitle)
      }).toPass({ timeout: 10000 })

      await game.menuToggle().click()
      await game.menuItem('prev-song').click()
      await page.waitForLoadState('networkidle')

      await expect(game.header()).toBeVisible()
    })

    test('end game returns to welcome page with reset state', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      const packSelect = app.packSelectPage()
      const welcome = app.welcomePage()
      const game = app.gamePage()
      await welcome.action('new-game').click()
      await page.waitForLoadState('networkidle')
      await packSelect.packRadioInputs().first().click()
      await packSelect.startGameButton().click()
      await page.waitForLoadState('networkidle')

      await game.nextSong().click()
      await page.waitForLoadState('networkidle')

      await game.menuToggle().click()
      await game.menuItem('end-game').click()
      await expect(app.dialog()).toBeVisible()

      await app.dialogButton('Cancel').click()
      await expect(app.dialog()).not.toBeVisible()
      await expect(game.header()).toBeVisible()

      await game.menuToggle().click()
      await game.menuItem('end-game').click()
      await app.dialogButton('End game').click()
      await page.waitForLoadState('networkidle')

      await expect(welcome.action('new-game')).toBeVisible()

      await welcome.action('new-game').click()
      await page.waitForLoadState('networkidle')
      await expect(packSelect.packRadioInputs().first()).toBeVisible()
    })
  })

  test.describe('Song Management', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('navigate to song management and back', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.welcomePage().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      const songMgmt = app.songManagementPage()
      await expect(songMgmt.list()).toBeVisible()
      await expect(songMgmt.row(1)).toBeVisible()
    })

    test('click song to preview', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.welcomePage().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      await app.songManagementPage().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      const songView = app.songViewPage()
      await expect(songView).toBeVisible()
      await expect(songView.backButton()).toBeVisible()
    })
  })

  test.describe('Navigation Consistency', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('back button from song view returns to song management', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.welcomePage().action('manage-songs').click()
      await page.waitForLoadState('networkidle')

      await app.songManagementPage().action('view-song-1').click()
      await page.waitForLoadState('networkidle')

      await app.songViewPage().backButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.songManagementPage().row(1)).toBeVisible()
    })
  })

  test.describe('State Persistence', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('game state survives page reload', async ({ page }) => {
      const app = pianoBingoLocator(page)
      await page.goto('/')
      await app.welcomePage().action('new-game').click()
      await page.waitForLoadState('networkidle')
      const packSelect = app.packSelectPage()
      await packSelect.packRadioInputs().first().click()
      await packSelect.startGameButton().click()
      await page.waitForLoadState('networkidle')

      const game = app.gamePage()
      const titleBefore = await game.navTitle().textContent()
      await game.nextSong().click()
      await page.waitForLoadState('networkidle')
      const titleAfter = await game.navTitle().textContent()
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
      const packSelect = app.packSelectPage()
      const welcome = app.welcomePage()
      const game = app.gamePage()
      await welcome.action('new-game').click()
      await page.waitForLoadState('networkidle')
      await packSelect.packRadioInputs().first().click()
      await packSelect.startGameButton().click()
      await page.waitForLoadState('networkidle')

      await game.menuToggle().click()
      await game.menuItem('end-game').click()
      await page.waitForLoadState('networkidle')
      await welcome.action('manage-songs').click()
      await page.waitForLoadState('networkidle')
      await app.songManagementPage().backButton().click()
      await page.waitForLoadState('networkidle')

      await welcome.action('new-game').click()
      await page.waitForLoadState('networkidle')
      await expect(packSelect.packRadioInputs().first()).toBeVisible()
    })
  })
})
