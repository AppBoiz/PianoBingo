import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

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
}

test.describe('Mobile viewport flows', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('welcome page actions are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=New Game')).toBeVisible()
    await expect(page.locator('text=Manage Songs')).toBeVisible()
    await expect(page.locator('text=Manage Playlists')).toBeVisible()
  })

  test('pack select renders and starts game', async ({ page }) => {
    await page.goto('/')
    await seedPackAndSong(page)
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('input[type="radio"]', { timeout: 10000 })
    await expect(page.locator('text=Start Game')).toBeVisible()

    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
  })

  test('pdf reader menu opens on mobile', async ({ page }) => {
    await page.goto('/')
    await seedPackAndSong(page)
    await page.click('text=New Game')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('input[type="radio"]', { timeout: 10000 })
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('nav h1')).toBeVisible()

    await page.click('label.hamburger')
    await expect(page.locator('.menu')).toBeVisible()
    await expect(page.locator('.menu').getByText('Next Song')).toBeVisible()
    await expect(page.locator('.menu').getByText('Game History')).toBeVisible()
  })

  test('song management list renders on mobile', async ({ page }) => {
    await page.goto('/')
    await seedPackAndSong(page)
    await page.click('text=Manage Songs')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Manage Songs')).toBeVisible()
    await expect(page.locator('.playlist-container')).toBeVisible()
  })
})
