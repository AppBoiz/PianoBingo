---
name: e2e-database-seeding
description: Write or refactor Playwright setup code for IndexedDB seeding, storage reset, and app state preparation in PianoBingo tests.
user-invocable: true
---

# E2E Database Seeding

Use this skill when adding or refactoring Playwright tests that need packs, songs, localStorage state, or a clean browser-side database.

## Primary files

- `tests/e2e/**`
- `tests/integration/**`
- `tests/support/locators/**`
- `src/shared/storage/indexedDb.ts`
- `src/shared/constants/navigation.ts`

## Rules

- Use Promise-based IndexedDB setup with `tx.oncomplete` as the completion signal.
- Never assume request ordering alone means the transaction has finished.
- If a spec needs repeated storage helpers, factor toward shared support code instead of copying another inline seeding block.
- Prefer real app flows when a test is meant to exercise app seeding behavior; direct DB writes are for setup, not for replacing the feature under test.

## Canonical browser-side pattern

```ts
await page.evaluate(async (payload) => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('PianoBingoDB')

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(['songs', 'packs'], 'readwrite')

      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)

      const songs = tx.objectStore('songs')
      const packs = tx.objectStore('packs')

      for (const song of payload.songs) songs.put(song)
      for (const pack of payload.packs) packs.put(pack)
    }
  })
}, payload)
```

## Common setup tasks

1. Clear IndexedDB and localStorage when isolation matters.
2. Seed only the minimum packs and songs required by the scenario.
3. Use route constants and locator builders for navigation and assertions.
4. If the scenario depends on service-worker or lazy seeding behavior, do not bypass it with direct DB setup unless the test is explicitly about another layer.

## Common mistakes

- finishing setup before `tx.oncomplete`
- mixing raw selectors with locator-builder patterns
- relying on welcome page load to trigger seeding
- importing `expect` from `@playwright/test` instead of `tests/support/locators/`