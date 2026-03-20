import { test, expect } from '@playwright/test';

test.describe('IndexedDB preloaded data initialization', () => {
  test('IndexedDB is seeded with preloaded data on first app load', async ({ page, context }) => {
    await context.clearCookies()

    // Register console listener BEFORE navigation so initialization messages are captured
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');

    // Wait for the preload initialization message — up to 10s, retried automatically
    await expect(async () => {
      expect(consoleMessages.join('\n')).toContain('Preloaded data initialized');
    }).toPass({ timeout: 10000 });

    // Read IndexedDB data. Uses a "remaining" counter so both onsuccess callbacks
    // can race freely without either one being missed.
    type DbInfo = {
      packsCount: number
      songsCount: number
      packs: Array<{ packId: number; packName: string }>
      sampleSongs?: Array<{ songId: number; title: string }>
      error?: string
    }

    const dbInfo = await page.evaluate(async (): Promise<DbInfo> => {
      return new Promise((resolve) => {
        const request = indexedDB.open('PianoBingoDB', 1);

        request.onsuccess = () => {
          const db = request.result;
          let packs: any[] = [];
          let songs: any[] = [];
          let remaining = 2;

          function finish() {
            remaining--;
            if (remaining === 0) {
              db.close();
              resolve({
                packsCount: packs.length,
                songsCount: songs.length,
                packs: packs.map((p: any) => ({ packId: p.packId, packName: p.packName })),
                sampleSongs: songs.slice(0, 3).map((s: any) => ({ songId: s.songId, title: s.title })),
              });
            }
          }

          const packReq = db.transaction('packs', 'readonly').objectStore('packs').getAll();
          packReq.onsuccess = () => { packs = packReq.result; finish(); };

          const songReq = db.transaction('songs', 'readonly').objectStore('songs').getAll();
          songReq.onsuccess = () => { songs = songReq.result; finish(); };
        };

        request.onerror = () => {
          resolve({ error: 'Failed to open database', packsCount: 0, songsCount: 0, packs: [] });
        };
      });
    });

    expect(dbInfo.packsCount).toBe(2);
    expect(dbInfo.songsCount).toBe(150);
    expect(dbInfo.packs).toContainEqual({ packId: 1, packName: 'Tom' });
    expect(dbInfo.packs).toContainEqual({ packId: 2, packName: 'Jack' });
  });
});
