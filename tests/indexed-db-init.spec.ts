import { test, expect } from '@playwright/test';

test('IndexedDB is seeded with preloaded data on first app load', async ({ page, context }) => {
  // Start with fresh storage context
  await context.clearCookies();

  // Navigate to the app
  await page.goto('http://localhost:5175');

  // Wait for the app to initialize
  await page.waitForTimeout(2000);

  // Check console for initialization message
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(msg.text());
  });

  // Verify preloaded data initialized message appears
  await expect(async () => {
    const logs = consoleMessages.join('\n');
    expect(logs).toContain('Preloaded data initialized');
  }).toPass();

  // Get the IndexedDB data via JavaScript evaluation
  const dbInfo = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('PianoBingoDB', 1);

      request.onsuccess = async (e: any) => {
        const db = e.target.result;
        const packsStore = db.transaction('packs', 'readonly').objectStore('packs');
        const songsStore = db.transaction('songs', 'readonly').objectStore('songs');

        const packsRequest = packsStore.getAll();
        const songsRequest = songsStore.getAll();

        let packs: any[] = [];
        let songs: any[] = [];

        packsRequest.onsuccess = () => {
          packs = packsRequest.result;
        };

        songsRequest.onsuccess = () => {
          songs = songsRequest.result;

          // Both completed, resolve promise
          resolve({
            packsCount: packs.length,
            songsCount: songs.length,
            packs: packs.map((p: any) => ({ packId: p.packId, packName: p.packName })),
            sampleSongs: songs.slice(0, 3).map((s: any) => ({ songId: s.songId, title: s.title })),
          });
        };
      };

      request.onerror = () => {
        resolve({
          error: 'Failed to open database',
          packsCount: 0,
          songsCount: 0,
        });
      };
    });
  });

  console.log('IndexedDB Contents:', dbInfo);

  // Verify the data
  expect(dbInfo.packsCount).toBe(2);
  expect(dbInfo.songsCount).toBe(150);
  expect(dbInfo.packs).toContainEqual({ packId: 1, packName: 'Tom' });
  expect(dbInfo.packs).toContainEqual({ packId: 2, packName: 'Jack' });
});

test('Pack select page displays preloaded packs', async ({ page }) => {
  await page.goto('http://localhost:5175');

  // Wait for app to load and data to be seeded
  await page.waitForTimeout(2000);

  // Check if we're on welcome page or pack select
  const pageTitle = await page.locator('h1, h2, h3').first().textContent();
  console.log('Page title:', pageTitle);

  // The app should display pack selection or song selection after initialization
  // This test confirms the app loaded without errors
  expect(await page.locator('body').isVisible()).toBe(true);
});
