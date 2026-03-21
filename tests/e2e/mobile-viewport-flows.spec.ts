import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { expect, pianoBingoLocator } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

async function seedPackAndSong(page: any) {
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
        tx.objectStore('packs').put({ packId: 1, packName: 'Test Pack', songs: [1], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Test Song', pdfUrl: pdf, version: 1 })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
}

test.describe('Mobile viewport flows', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('welcome page actions are visible', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.goto('/')

    await expect(app.pageWelcome().action('new-game')).toBeVisible()
    await expect(app.pageWelcome().action('manage-songs')).toBeVisible()
    await expect(app.pageWelcome().action('manage-playlists')).toBeVisible()
  })

  test('pack select renders and starts game', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.goto('/')
    await seedPackAndSong(page)
    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')

    await expect(app.pagePackSelect().packRadioInputs().first()).toBeVisible()
    await expect(app.pagePackSelect().startGameButton()).toBeVisible()

    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')

    await expect(app.pageGame().nextSong()).toBeVisible()
  })

  test('hamburger menu opens on mobile game screen', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.goto('/')
    await seedPackAndSong(page)
    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await expect(app.pagePackSelect().packRadioInputs().first()).toBeVisible()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')

    await expect(app.pageGame().navTitle()).toBeVisible()

    await app.pageGame().menuToggle().click()
    await expect(app.pageGame().menu()).toBeVisible()
    await expect(app.pageGame().menuItem('next-song')).toBeVisible()
    await expect(app.pageGame().menuItem('game-history')).toBeVisible()
  })

  test('song management list renders on mobile', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.goto('/')
    await seedPackAndSong(page)
    await app.pageWelcome().action('manage-songs').click()
    await page.waitForLoadState('networkidle')

    await expect(app.pageSongManagement().header()).toBeVisible()
    await expect(app.pageSongManagement().list()).toBeVisible()
  })
})
