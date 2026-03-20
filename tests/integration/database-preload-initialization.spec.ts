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

    // IDB seeding is lazy: openDB() (which seeds on first call) only runs when a component
    // first accesses the database.  Navigate in-SPA to pack management so that the
    // PackManagement component mounts and calls loadAllPacks() → openDB().
    await page.evaluate(() => {
      window.history.pushState({}, '', '/pack-management');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Poll until both stores are fully seeded (2 packs, 150 songs).
    // Uses page.evaluate inside expect().toPass() so that the Node-side retry
    // loop drives polling — avoids the pitfall where waitForFunction resolves
    // with a JSHandle to an unresolved Promise (which jsonValue() returns as null).
    type DbResult = { packsCount: number; songsCount: number; packs: Array<{ packId: number; packName: string }> };
    let result: DbResult | null = null;

    await expect(async () => {
      try {
        result = await page.evaluate(() => {
          return new Promise<{ packsCount: number; songsCount: number; packs: Array<{ packId: number; packName: string }> } | null>(
            (resolve) => {
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
                    if (packs.length === 2 && songs.length === 150) {
                      resolve({
                        packsCount: packs.length,
                        songsCount: songs.length,
                        packs: packs.map((p: any) => ({ packId: p.packId, packName: p.packName })),
                      });
                    } else {
                      resolve(null); // not fully seeded yet — toPass() will retry
                    }
                  }
                }

                const packTx = db.transaction('packs', 'readonly');
                const packReq = packTx.objectStore('packs').getAll();
                packReq.onsuccess = () => { packs = packReq.result; finish(); };
                packReq.onerror = () => { db.close(); resolve(null); };

                const songTx = db.transaction('songs', 'readonly');
                const songReq = songTx.objectStore('songs').getAll();
                songReq.onsuccess = () => { songs = songReq.result; finish(); };
                songReq.onerror = () => { db.close(); resolve(null); };
              };

              request.onerror = () => resolve(null);
              request.onblocked = () => resolve(null);
            }
          );
        });
      } catch {
        result = null; // context destroyed by SW clientsClaim — will retry
      }
      expect(result).not.toBeNull();
    }).toPass({ timeout: 30000 });

    expect(result!.packsCount).toBe(2);
    expect(result!.songsCount).toBe(150);
    expect(result!.packs).toContainEqual({ packId: 1, packName: 'Tom' });
    expect(result!.packs).toContainEqual({ packId: 2, packName: 'Jack' });
  });
});
