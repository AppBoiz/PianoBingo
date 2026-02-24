import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

async function seedPackAndSong(page: any) {
  await page.goto('/')
  await page.evaluate(async (pdf) => {
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
        if (!db.objectStoreNames.contains('packs')) {
          db.createObjectStore('packs', { keyPath: 'packId' })
        }
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'songId' })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['packs', 'songs'], 'readwrite')
        tx.objectStore('packs').put({ packId: 1, packName: 'Test Pack', songs: [1], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Test Song', pdfUrl: pdf, version: 1 })
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          resolve()
        }
      }
      req.onerror = () => resolve()
    })
  }, pdfBase64)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

test.describe('GameHistory Page', () => {
  test.beforeEach(async ({ page }) => {
    await seedPackAndSong(page)
  })

  test('displays 75-box bingo grid with highlighted boxes', async ({ page }) => {
    // Navigate to welcome page and start a game
    await page.waitForLoadState('networkidle')
    
    // Start game and select a pack
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    
    // Select the first pack
    await page.waitForSelector('input[type="radio"]', { timeout: 10000 })
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
    
    // Navigate to game history
    await page.click('label.hamburger')
    await page.click('.menu >> text=Game History')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Game History' }).first()).toBeVisible()
    
    // Verify 75 boxes are rendered
    const boxes = page.locator('.box')
    await expect(boxes).toHaveCount(75)
    
    // Verify at least one box is highlighted (the first drawn song)
    const highlightedBoxes = page.locator('.box.highlighted')
    const count = await highlightedBoxes.count()
    expect(count).toBeGreaterThan(0)
    
    // Verify boxes are numbered 1-75
    const firstBox = boxes.first()
    await expect(firstBox).toHaveText('1')
    const lastBox = boxes.last()
    await expect(lastBox).toHaveText('75')
  })

  test('shows message when no active game', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Navigate directly to game history without starting a game
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game-history')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Game History' }).first()).toBeVisible()
    
    // Should show "no active game" message
    await expect(page.locator('text=No active game')).toBeVisible()
    
    // Should not show any boxes
    const boxes = page.locator('.box')
    await expect(boxes).toHaveCount(0)
  })

  test('back button navigates to game page', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Start a game
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('input[type="radio"]', { timeout: 10000 })
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
    
    // Navigate to game history
    await page.click('label.hamburger')
    await page.click('.menu >> text=Game History')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Game History' }).first()).toBeVisible()
    
    // Click back button
    const backButton = page.locator('button:has-text("Back")')
    await backButton.click()
    await page.waitForLoadState('networkidle')
    
    // Should navigate to game page (song view)
    await expect(page).toHaveURL(/\/pdf-reader/)
    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
  })
})
