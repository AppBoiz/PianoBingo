import fs from 'fs'
import { test, expect } from '@playwright/test'

async function seedUserData(page: any) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('PianoBingoDB', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs', { keyPath: 'packId' })
      if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'songId' })
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(['packs', 'songs'], 'readwrite')
      tx.objectStore('songs').put({ songId: 9001, title: 'My Backup Song', pdfUrl: 'JVBERi0dXNlci1wZGY=', version: 2 })
      tx.objectStore('packs').put({ packId: 1000000, packName: 'My Backup Playlist', songs: [9001], songCount: 1, version: 2 })
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
    request.onerror = () => reject(request.error)
  }))
}

async function replaceUserData(page: any) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('PianoBingoDB', 1)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(['packs', 'songs'], 'readwrite')
      const packs = tx.objectStore('packs')
      const songs = tx.objectStore('songs')
      packs.clear()
      songs.clear()
      songs.put({ songId: 777, title: 'Replacement Song', pdfUrl: null, version: 1 })
      packs.put({ packId: 1000001, packName: 'Replacement Playlist', songs: [777], songCount: 1, version: 1 })
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
    request.onerror = () => reject(request.error)
  }))
}

test.describe('Data backup and restore', () => {
  test('downloads one file and restores songs, PDFs, and playlists from it', async ({ page }) => {
    await page.goto('/')
    await seedUserData(page)
    await page.locator('[data-action="backup-restore"]').click()
    await expect(page.getByTestId('data-backup-page')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-action="save-backup"]').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^piano-bingo-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const downloadPath = await download.path()
    expect(downloadPath).not.toBeNull()

    const backup = JSON.parse(fs.readFileSync(downloadPath!, 'utf8'))
    expect(backup.format).toBe('piano-bingo-data-backup')
    expect(backup.data.songs).toContainEqual(expect.objectContaining({
      songId: 9001,
      title: 'My Backup Song',
      pdfUrl: 'JVBERi0dXNlci1wZGY=',
    }))
    expect(backup.data.packs).toContainEqual(expect.objectContaining({
      packId: 1000000,
      packName: 'My Backup Playlist',
      songs: [9001],
    }))

    await replaceUserData(page)
    await page.evaluate(() => localStorage.setItem('gameState', JSON.stringify({ selectedSongPackId: 1000001 })))
    await page.getByTestId('restore-backup-input').setInputFiles(downloadPath!)
    await expect(page.getByTestId('restore-confirmation')).toBeVisible()
    await page.locator('[data-action="confirm-restore"]').click()
    await expect(page.getByTestId('backup-notice')).toContainText('Restore complete')

    const restored = await page.evaluate(() => new Promise<any>((resolve, reject) => {
      const request = indexedDB.open('PianoBingoDB', 1)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction(['packs', 'songs'], 'readonly')
        const songRequest = tx.objectStore('songs').getAll()
        const packRequest = tx.objectStore('packs').getAll()
        tx.oncomplete = () => {
          db.close()
          resolve({ songs: songRequest.result, packs: packRequest.result, gameState: localStorage.getItem('gameState') })
        }
        tx.onerror = () => { db.close(); reject(tx.error) }
      }
      request.onerror = () => reject(request.error)
    }))

    expect(restored.songs).toContainEqual(expect.objectContaining({ songId: 9001, pdfUrl: 'JVBERi0dXNlci1wZGY=' }))
    expect(restored.songs).not.toContainEqual(expect.objectContaining({ songId: 777 }))
    expect(restored.packs).toContainEqual(expect.objectContaining({ packId: 1000000, songs: [9001] }))
    expect(restored.packs).not.toContainEqual(expect.objectContaining({ packId: 1000001 }))
    expect(restored.gameState).toBeNull()
  })

  test('rejects an unrelated JSON file before showing restore confirmation', async ({ page }) => {
    await page.goto('/data-backup')
    await page.getByTestId('restore-backup-input').setInputFiles({
      name: 'not-a-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello":"world"}'),
    })

    await expect(page.getByTestId('backup-notice')).toContainText('not a Piano Bingo backup')
    await expect(page.getByTestId('restore-confirmation')).toHaveCount(0)
  })
})
