import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { PACK_SIZE } from '../../src/shared/constants/game'
import { pianoBingoLocator, pianoExpect } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

async function seedPackAndSong(page: any) {
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
        tx.objectStore('packs').put({ packId: 1, packName: 'Test Pack', songs: [1], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Test Song', pdfUrl: pdf, version: 1 })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

test.describe('Game History Page', () => {
  test.beforeEach(async ({ page }) => {
    await seedPackAndSong(page)
  })

  test(`displays ${PACK_SIZE}-box bingo grid with highlighted boxes`, async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.waitForLoadState('networkidle')

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().packRadioInputs().first().click()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGame().nextSong()).toBeVisible()

    await app.pageGame().menuToggle().click()
    await app.pageGame().menuItem('game-history').click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGameHistory().header()).toBeVisible()

    const boxes = app.pageGameHistory().boxes()
    await pianoExpect(boxes).toHaveCount(PACK_SIZE)

    const highlightedCount = await app.pageGameHistory().highlightedBoxes().count()
    expect(highlightedCount).toBeGreaterThan(0)

    await pianoExpect(app.pageGameHistory().box(1)).toHaveText('1')
    await pianoExpect(app.pageGameHistory().box(PACK_SIZE)).toHaveText(String(PACK_SIZE))
  })

  test('shows empty state message when no active game', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => {
      localStorage.removeItem('gameState')
      window.history.pushState({}, '', '/game-history')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGameHistory().emptyState()).toBeVisible()
  })

  test('back button returns to game page', async ({ page }) => {
    const app = pianoBingoLocator(page)
    await page.waitForLoadState('networkidle')

    await app.pageWelcome().action('new-game').click()
    await page.waitForLoadState('networkidle')
    await app.pagePackSelect().packRadioInputs().first().click()
    await app.pagePackSelect().startGameButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGame().nextSong()).toBeVisible()

    await app.pageGame().menuToggle().click()
    await app.pageGame().menuItem('game-history').click()
    await page.waitForLoadState('networkidle')
    await pianoExpect(app.pageGameHistory().header()).toBeVisible()

    await app.pageGameHistory().backButton().click()
    await page.waitForLoadState('networkidle')

    await pianoExpect(app.pageGame().nextSong()).toBeVisible()
  })
})
