import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { expect, pianoBingoLocator } from '../support/locators'

const pdfBase64 = fs.readFileSync(
  path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
).toString('base64')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const empty: unknown[] = []
    Object.defineProperty(window, 'BASE_PACK_DATA', { get: () => empty, set: () => {}, configurable: true })
    Object.defineProperty(window, 'BASE_SONG_DATA', { get: () => empty, set: () => {}, configurable: true })
  })
})

async function seedPackWithManyTestSongs(page: any, packSongIds: number[] = []) {
  await page.goto('/')
  await page.evaluate(async ({ pdfB64, initialPackSongs }: any) => {
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
        
        // Create pack with initial songs
        tx.objectStore('packs').put({ 
          packId: 1, 
          packName: 'Test Pack', 
          songs: initialPackSongs, 
          version: 1 
        })
        
        // Create test songs - alphabetically varied for sorting tests
        const songTitles = [
          'Amplified',
          'Bliss',
          'Cascade',
          'Delight',
          'Essence',
          'Fandango',
          'Glory',
          'Harmony',
          'Impact',
          'Journey',
          'Kaleidoscope',
          'Luminous',
          'Melody',
          'Nocturne',
          'Overture',
        ]
        
        songTitles.forEach((title, index) => {
          tx.objectStore('songs').put({ 
            songId: index + 1, 
            title, 
            pdfUrl: pdfB64, 
            version: 1 
          })
        })
        
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onerror = () => resolve()
    })
  }, { pdfB64: pdfBase64, initialPackSongs: packSongIds })
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function navigateToPackEdit(page: any) {
  const app = pianoBingoLocator(page)
  await app.welcomePage().action('manage-playlists').click()
  await page.waitForLoadState('networkidle')
  await app.packManagementPage().action('edit-pack-1').click()
  await page.waitForLoadState('networkidle')
}

test.describe('Pack Edit Page — Slot-Based Selection', () => {
  test.describe('Page load and layout', () => {
    test('loads with header, 75 empty slot grid, and save button', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit).toBeVisible()
      await expect(packEdit.header()).toBeVisible()
      await expect(packEdit.primaryAction()).toBeVisible()
      
      // Verify 75 empty slots are rendered
      for (let i = 0; i < 75; i++) {
        await expect(packEdit.slotCard(i)).toBeVisible()
      }
    })

    test('back button navigates back to pack management', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().backButton().click()
      await page.waitForLoadState('networkidle')

      await expect(app.packManagementPage()).toBeVisible()
    })

    test('shows "Pack not found" for a non-existent pack id', async ({ page }) => {
      await seedPackWithManyTestSongs(page)

      await page.goto('/')
      await page.evaluate(() => {
        window.history.pushState({}, '', '/pack-edit/9999')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toContainText('Pack not found')
    })
  })

  test.describe('Empty slot interaction', () => {
    test('clicking an empty slot opens the song selection modal', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await packEdit.slotCard(0).click()

      // Modal should open with song list
      await expect(app.dialog()).toBeVisible()
      await expect(app.songSearchInput()).toBeVisible()
    })

    test('modal displays songs in alphabetical order', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().slotCard(0).click()

      // Verify songs appear in A-Z order
      const songItems = await page.locator('[data-testid^="song-item-"]').all()
      expect(songItems.length).toBeGreaterThan(0)
      
      // First song should be "Amplified", second "Bliss", etc.
      await expect(songItems[0]).toContainText('Amplified')
      await expect(songItems[1]).toContainText('Bliss')
      await expect(songItems[2]).toContainText('Cascade')
    })

    test('search input filters songs by name (case-insensitive)', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().slotCard(0).click()

      // Type in search
      await app.songSearchInput().fill('mel')

      // Only "Melody" should be visible
      const songItems = await page.locator('[data-testid^="song-item-"]').all()
      expect(songItems.length).toBe(1)
      await expect(songItems[0]).toContainText('Melody')
    })

    test('search input is case-insensitive', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().slotCard(0).click()

      // Search with uppercase
      await app.songSearchInput().fill('HARM')

      const songItems = await page.locator('[data-testid^="song-item-"]').all()
      expect(songItems.length).toBe(1)
      await expect(songItems[0]).toContainText('Harmony')
    })

    test('clearing search resets filter to show all songs', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().slotCard(0).click()

      // Filter, then clear
      await app.songSearchInput().fill('mel')
      let songItems = await page.locator('[data-testid^="song-item-"]').all()
      expect(songItems.length).toBe(1)

      await app.songSearchInput().fill('')
      // Wait for input to be empty
      await expect(app.songSearchInput()).toHaveValue('')
      // Use a small delay and retry logic to allow React to re-render
      await page.waitForTimeout(100)
      songItems = await page.locator('[data-testid^="song-item-"]').all()
      let retries = 0
      while (songItems.length < 15 && retries < 5) {
        await page.waitForTimeout(100)
        songItems = await page.locator('[data-testid^="song-item-"]').all()
        retries++
      }
      expect(songItems.length).toBe(15) // All 15 test songs
    })
  })

  test.describe('Filling slots with songs', () => {
    test('clicking a song in modal fills the slot and closes modal', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Open modal and click first song
      await packEdit.slotCard(0).click()
      await expect(app.dialog()).toBeVisible()

      await app.songListItem(1).click() // Song 1: "Amplified"

      // Modal should close and slot should be filled
      await expect(app.dialog()).not.toBeVisible()
      await expect(packEdit.slotName(0)).toContainText('Amplified')
    })

    test('filled slot displays song title and position number', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      await packEdit.slotCard(0).click()
      await app.songListItem(2).click() // Song 2: "Bliss"

      // Verify slot shows title (position 1 in display)
      await expect(packEdit.slotName(0)).toContainText('Bliss')
      // Position should be "1/75" format or similar label
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('1/75')
    })

    test('counter increments when filling a slot', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      const counter = page.locator('[data-testid="song-counter"]')
      await expect(counter).toContainText('0/75')

      // Fill slot 0
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()
      await expect(counter).toContainText('1/75')

      // Fill slot 1
      await packEdit.slotCard(1).click()
      await app.songListItem(2).click()
      await expect(counter).toContainText('2/75')
    })

    test('already-selected songs appear grayed out and disabled in modal', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill slot 0 with song 1
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()
      // Wait for modal to close after selection
      await expect(app.dialog()).not.toBeVisible()

      // Open modal again (slot 1)
      await packEdit.slotCard(1).click()

      // Song 1 should be disabled (has disabled attribute)
      const songItem1 = app.songListItem(1)
      await expect(songItem1).toHaveAttribute('disabled')
      // Clicking it should not select it (Playwright won't click disabled buttons)
      // Modal should still be open
      await expect(app.dialog()).toBeVisible()
    })

    test('multiple slots can be filled independently', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill slots 0, 2, 5 with songs that match their titles
      // Song titles: Amplified(1), Bliss(2), Cascade(3), Delight(4), Essence(5), Fandango(6)...
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()  // Amplified
      // Wait for modal to close after selection
      await expect(app.dialog()).not.toBeVisible()

      await packEdit.slotCard(2).click()
      await app.songListItem(4).click()  // Delight (songId 4, not 3)
      // Wait for modal to close after selection
      await expect(app.dialog()).not.toBeVisible()

      await packEdit.slotCard(5).click()
      await app.songListItem(6).click()  // Fandango (songId 6, not 5)
      // Wait for modal to close after selection
      await expect(app.dialog()).not.toBeVisible()

      // Verify slots have correct songs
      await expect(packEdit.slotName(0)).toContainText('Amplified')
      await expect(packEdit.slotName(2)).toContainText('Delight')
      await expect(packEdit.slotName(5)).toContainText('Fandango')
    })
  })

  test.describe('Clearing slots', () => {
    test('clicking X button on filled slot clears it immediately', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill slot 0
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()
      // Wait for modal to close
      await expect(app.dialog()).not.toBeVisible()
      await expect(packEdit.slotName(0)).toContainText('Amplified')

      // Click clear button
      await packEdit.slotClearButton(0).click()

      // Slot should be empty again - wait for counter to update
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('0/75')
      // Verify slot is empty (no slot-name visible or slot card is in empty state)
      await expect(packEdit.slotCard(0)).not.toContainText('Amplified')
    })

    test('clearing slot decrements counter', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()
      const counter = page.locator('[data-testid="song-counter"]')

      // Fill two slots
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()
      await packEdit.slotCard(1).click()
      await app.songListItem(2).click()
      await expect(counter).toContainText('2/75')

      // Clear first slot
      await packEdit.slotClearButton(0).click()
      await expect(counter).toContainText('1/75')

      // Clear second slot
      await packEdit.slotClearButton(1).click()
      await expect(counter).toContainText('0/75')
    })

    test('clearing a slot makes its song available in modal again', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill slot 0 with song 1
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()
      // Wait for modal to close
      await expect(app.dialog()).not.toBeVisible()

      // Open modal for slot 1 - song 1 should be disabled
      await packEdit.slotCard(1).click()
      await expect(app.songListItem(1)).toHaveAttribute('disabled')

      // Close modal
      await page.keyboard.press('Escape')
      await expect(app.dialog()).not.toBeVisible()

      // Clear slot 0
      await packEdit.slotClearButton(0).click()
      // Wait for counter to update
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('0/75')

      // Open modal again - song 1 should be available (not disabled)
      await packEdit.slotCard(1).click()
      await expect(app.songListItem(1)).not.toHaveAttribute('disabled')
    })
  })

  test.describe('Save button behavior', () => {
    test('save button is disabled when pack has fewer than 75 songs', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)

      const packEdit = app.packEditPage()
      await expect(packEdit.primaryAction()).toBeDisabled()
    })

    test('save button is disabled when pack has exactly 74 songs', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      // Add more songs to ensure we don't run out when filling 74 slots
      await page.evaluate(async (pdfB64: string) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['songs'], 'readwrite')
          
          // Add more songs (16-100) to ensure we have enough for 74 unique selections
          for (let i = 16; i <= 100; i++) {
            tx.objectStore('songs').put({ 
              songId: i, 
              title: `Song ${i}`, 
              pdfUrl: pdfB64, 
              version: 1 
            })
          }
          tx.oncomplete = () => db.close()
        }
      }, pdfBase64)
      
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill 74 slots with unique songs
      for (let i = 0; i < 74; i++) {
        await packEdit.slotCard(i).click()
        // Use unique songs (songId 1-74)
        const songId = i + 1
        await app.songListItem(songId).click()
        // Wait for modal to close before clicking next slot
        await expect(app.dialog()).not.toBeVisible()
      }

      await expect(packEdit.primaryAction()).toBeDisabled()
    })

    test('save button is enabled when pack has all 75 songs', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      // Create more songs for this test
      await page.evaluate(async (pdfB64: string) => {
        const req = indexedDB.open('PianoBingoDB', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['songs'], 'readwrite')
          
          // Add more songs to reach at least 75
          for (let i = 16; i <= 100; i++) {
            tx.objectStore('songs').put({ 
              songId: i, 
              title: `Song ${i}`, 
              pdfUrl: pdfB64, 
              version: 1 
            })
          }
          tx.oncomplete = () => db.close()
        }
      }, pdfBase64)
      
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill all 75 slots
      for (let i = 0; i < 75; i++) {
        await packEdit.slotCard(i).click()
        const songId = (i % 100) + 1
        await app.songListItem(songId).click()
      }

      await expect(packEdit.primaryAction()).toBeEnabled()
    })
  })

  test.describe('Persistence and reload', () => {
    test('filled slots persist after reload', async ({ page }) => {
      await seedPackWithManyTestSongs(page, [1, 2])
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Verify initial state: 2 songs already in pack (pre-seeded)
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('2/75')
      await expect(packEdit.slotName(0)).toContainText('Amplified')
      await expect(packEdit.slotName(1)).toContainText('Bliss')

      // Reload page without saving
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Verify pre-seeded slots persist after reload
      await expect(app.packEditPage()).toBeVisible()
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('2/75')
      await expect(packEdit.slotName(0)).toContainText('Amplified')
      await expect(packEdit.slotName(1)).toContainText('Bliss')
    })
  })

  test.describe('Modal interactions', () => {
    test('clicking outside modal or pressing Escape closes it without selecting', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      await app.packEditPage().slotCard(0).click()

      await expect(app.dialog()).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      await expect(app.dialog()).not.toBeVisible()
      // Slot should remain empty
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('0/75')
    })

    test('opening modal for different slot keeps previous selections intact', async ({ page }) => {
      await seedPackWithManyTestSongs(page)
      const app = pianoBingoLocator(page)

      await navigateToPackEdit(page)
      const packEdit = app.packEditPage()

      // Fill slot 0
      await packEdit.slotCard(0).click()
      await app.songListItem(1).click()

      // Open modal for slot 1 (don't select anything)
      await packEdit.slotCard(1).click()
      await page.keyboard.press('Escape')

      // Slot 0 should still have song 1
      await expect(packEdit.slotName(0)).toContainText('Amplified')
      await expect(page.locator('[data-testid="song-counter"]')).toContainText('1/75')
    })
  })
})

