import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { PACK_SIZE } from '../src/constants/game'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

async function seedMultiplePacks(page: any) {
  // Seed test data: 2 packs with multiple songs each
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
        
        // Pack 1
        tx.objectStore('packs').put({ packId: 1, packName: 'Classical Pack', songs: [1, 2, 3], version: 1 })
        tx.objectStore('songs').put({ songId: 1, title: 'Moonlight Sonata', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 2, title: 'Fur Elise', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 3, title: 'Ode to Joy', pdfUrl: pdf, version: 1 })
        
        // Pack 2
        tx.objectStore('packs').put({ packId: 2, packName: 'Jazz Pack', songs: [4, 5], version: 1 })
        tx.objectStore('songs').put({ songId: 4, title: 'Take Five', pdfUrl: pdf, version: 1 })
        tx.objectStore('songs').put({ songId: 5, title: 'All Blues', pdfUrl: pdf, version: 1 })
        
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

test.describe('Parity Smoke Tests - React Implementation Regression', () => {
  
  test.describe('Welcome Page', () => {
    test('welcome page loads with all action buttons', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verify all main actions are available
      await expect(page.locator('text=New Game')).toBeVisible()
      await expect(page.locator('text=Manage Songs')).toBeVisible()
      await expect(page.locator('text=Manage Playlists')).toBeVisible()
    })

    test('click New Game navigates to Pack Select', async ({ page }) => {
      await seedMultiplePacks(page)
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      
      // Should be on pack select page with packs visible
      await expect(page.locator('text=Classical Pack')).toBeVisible()
      await expect(page.locator('text=Jazz Pack')).toBeVisible()
    })
  })

  test.describe('Core Game Flow', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('complete workflow: welcome → pack select → game → history', async ({ page }) => {
      // Start from welcome
      await page.goto('/')
      
      // Click New Game
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      
      // Select first pack
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      
      // Should be on PDF reader with first song
      await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
      await expect(page.locator('nav >> text=1 -')).toBeVisible() // Song index
      
      // Draw next song
      await page.click('text=Next Song')
      await page.waitForLoadState('networkidle')
      
      // Should show song 2
      await expect(page.locator('nav >> text=2 -')).toBeVisible()
      
      // Open hamburger menu
      await page.click('label.hamburger')
      await expect(page.locator('.menu')).toBeVisible()
      
      // Navigate to game history
      await page.click('.menu >> text=Game History')
      await page.waitForLoadState('networkidle')
      
      // Verify game history shows grid
      await expect(page.getByRole('heading', { name: 'Game History' })).toBeVisible()
      const boxes = page.locator('.box')
      await expect(boxes).toHaveCount(PACK_SIZE)
      
      // At least 2 boxes should be highlighted (first and second songs drawn)
      const highlighted = page.locator('.box.highlighted')
      const count = await highlighted.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    test('song progression increments correctly', async ({ page }) => {
      await page.goto('/')
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      
      // Verify starting at song 1
      const nav = page.locator('nav')
      const song1Text = await nav.locator('text=Moonlight Sonata').count()
      expect(song1Text).toBeGreaterThan(0)
      
      // Draw next
      await page.click('text=Next Song')
      await page.waitForLoadState('networkidle')
      
      // Verify song 2
      const song2Text = await nav.locator('text=Fur Elise').count()
      expect(song2Text).toBeGreaterThan(0)
      
      // Go back
      await page.click('label.hamburger')
      await page.click('.menu >> text=Previous Song')
      await page.waitForLoadState('networkidle')
      
      // Verify back to song 1
      const backToSong1 = await nav.locator('text=Moonlight Sonata').count()
      expect(backToSong1).toBeGreaterThan(0)
    })

    test('end game returns to welcome page with reset state', async ({ page }) => {
      await page.goto('/')
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      
      // Draw a song
      await page.click('text=Next Song')
      await page.waitForLoadState('networkidle')
      
      // End game from hamburger menu
      await page.click('label.hamburger')
      await page.click('.menu >> text=End Game')
      await page.waitForLoadState('networkidle')
      
      // Should be back at welcome
      await expect(page.locator('text=New Game')).toBeVisible()
      
      // Start new game - should see fresh pack select
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      
      // Pack list visible
      await expect(page.locator('text=Classical Pack')).toBeVisible()
    })
  })

  test.describe('Song Management', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('navigate to song management and back', async ({ page }) => {
      await page.goto('/')
      
      // Click Manage Songs
      await page.click('text=Manage Songs')
      await page.waitForLoadState('networkidle')
      
      // Should see song list
      await expect(page.locator('text=Moonlight Sonata')).toBeVisible()
      await expect(page.locator('text=Take Five')).toBeVisible()
    })

    test('click song to preview', async ({ page }) => {
      await page.goto('/')
      await page.click('text=Manage Songs')
      await page.waitForLoadState('networkidle')
      
      // Click first song to preview
      await page.click('text=Moonlight Sonata')
      await page.waitForLoadState('networkidle')
      
      // Should show song view with title
      await expect(page.locator('text=Moonlight Sonata')).toBeVisible()
      
      // Back button should exist
      await expect(page.locator('button >> text=‹')).toBeVisible()
    })
  })

  test.describe('Pack Management', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('navigate to pack management', async ({ page }) => {
      await page.goto('/')
      
      // Click Manage Playlists
      await page.click('text=Manage Playlists')
      await page.waitForLoadState('networkidle')
      
      // Should see pack list
      await expect(page.locator('text=Classical Pack')).toBeVisible()
      await expect(page.locator('text=Jazz Pack')).toBeVisible()
    })
  })

  test.describe('Navigation Consistency', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('back button navigates correctly from game history', async ({ page }) => {
      // Start a game and draw a song
      await page.goto('/')
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      await page.click('text=Next Song')
      await page.waitForLoadState('networkidle')
      
      // Go to game history
      await page.click('label.hamburger')
      await page.click('.menu >> text=Game History')
      await page.waitForLoadState('networkidle')
      
      // Click back button
      await page.click('button >> text=‹')
      await page.waitForLoadState('networkidle')
      
      // Should return to PDF reader
      await expect(page.getByRole('button', { name: 'Next Song' })).toBeVisible()
    })

    test('back button from song view returns to song management with reset state', async ({ page }) => {
      await page.goto('/')
      await page.click('text=Manage Songs')
      await page.waitForLoadState('networkidle')
      
      // Preview a song
      await page.click('text=Moonlight Sonata')
      await page.waitForLoadState('networkidle')
      
      // Click back
      await page.click('button >> text=‹')
      await page.waitForLoadState('networkidle')
      
      // Should be back at song management
      await expect(page.locator('text=Manage Playlists')).toBeHidden()
      await expect(page.locator('text=Moonlight Sonata')).toBeVisible()
    })
  })

  test.describe('State Persistence', () => {
    test.beforeEach(async ({ page }) => {
      await seedMultiplePacks(page)
    })

    test('game state survives page reload', async ({ page }) => {
      // Start game and draw songs
      await page.goto('/')
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      
      // Draw song 2
      await page.click('text=Next Song')
      await page.waitForLoadState('networkidle')
      
      // Verify on song 2
      await expect(page.locator('nav >> text=2 -')).toBeVisible()
      
      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')
      
      // Should still be at song 2
      await expect(page.locator('nav >> text=2 -')).toBeVisible()
    })

    test('pack selection persists across navigation', async ({ page }) => {
      // Start game with pack 1
      await page.goto('/')
      await page.click('text=New Game')
      await page.waitForLoadState('networkidle')
      await page.click('input[type="radio"]:first-of-type')
      await page.click('text=Start Game')
      await page.waitForLoadState('networkidle')
      
      // Go to song management and back
      await page.click('label.hamburger')
      await page.click('text=End Game')
      await page.waitForLoadState('networkidle')
      await page.click('text=Manage Songs')
      await page.waitForLoadState('networkidle')
      await page.click('text=Manage Playlists')
      await page.waitForLoadState('networkidle')
      
      // Start new game - should still see packs
      await page.goto('/pack-select')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Classical Pack')).toBeVisible()
    })
  })

  test.describe('Offline Functionality', () => {
    test('app functions offline (smoke test)', async ({ page }) => {
      await seedMultiplePacks(page)
      
      // Go offline
      await page.context().setOffline(true)
      
      // Navigate to app
      await page.goto('/')
      
      // Should still load welcome page
      await expect(page.locator('text=New Game')).toBeVisible()
      
      // Go back online
      await page.context().setOffline(false)
    })
  })
})
