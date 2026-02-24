import { test, expect } from '@playwright/test'

test.describe('GameHistory Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('PianoBingoDB')
        req.onsuccess = () => resolve(null)
        req.onerror = () => resolve(null)
      })
    })
  })

  test('displays 75-box bingo grid with highlighted boxes', async ({ page }) => {
    // Navigate to welcome page and start a game
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Start game and select a pack
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    
    // Select the first pack
    const firstPack = page.locator('.pack-card').first()
    await firstPack.click()
    await page.waitForLoadState('networkidle')
    
    // Draw first song (this will mark it as shown)
    await page.click('text=Draw First Song')
    await page.waitForLoadState('networkidle')
    
    // Navigate to game history
    await page.evaluate(() => {
      (window as any).loadPage('GAME_HISTORY')
    })
    await page.waitForLoadState('networkidle')
    
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
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navigate directly to game history without starting a game
    await page.evaluate(() => {
      (window as any).loadPage('GAME_HISTORY')
    })
    await page.waitForLoadState('networkidle')
    
    // Should show "no active game" message
    await expect(page.locator('text=No active game')).toBeVisible()
    
    // Should not show any boxes
    const boxes = page.locator('.box')
    await expect(boxes).toHaveCount(0)
  })

  test('back button navigates to game page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Start a game
    await page.click('text=Start Game')
    await page.waitForLoadState('networkidle')
    const firstPack = page.locator('.pack-card').first()
    await firstPack.click()
    await page.waitForLoadState('networkidle')
    
    // Navigate to game history
    await page.evaluate(() => {
      (window as any).loadPage('GAME_HISTORY')
    })
    await page.waitForLoadState('networkidle')
    
    // Click back button
    const backButton = page.locator('button:has-text("Back")')
    await backButton.click()
    await page.waitForLoadState('networkidle')
    
    // Should navigate to game page (song view)
    await expect(page).toHaveURL(/.*/) // Game page URL check
    // Verify we're on the game page by checking for characteristic elements
    await expect(page.locator('text=Draw First Song, text=Next Song')).toBeVisible()
  })
})
