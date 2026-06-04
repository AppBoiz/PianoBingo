# PianoBingo E2E Testing Guide

This guide explains how end-to-end and integration tests are written in PianoBingo, how the custom locator system works, and what patterns to follow when adding new Playwright coverage.

## Test Stack Overview

PianoBingo uses two test layers for browser-facing behavior:

- `tests/e2e/`: user workflow tests
- `tests/integration/`: browser, storage, preload, and service-worker integration tests

Playwright is configured in `playwright.config.ts` to:

- run tests from `tests/`
- include `tests/e2e/**/*.spec.ts` and `tests/integration/**/*.spec.ts`
- build the app first with `npm run build`
- serve `dist/` locally on port `3000`

This means browser tests run against a production-style build, not the Vite dev server.

## Key Commands

Run Playwright tests:

```bash
npm run test:e2e
```

Run Playwright in UI mode:

```bash
npm run test:e2e:ui
```

Run everything:

```bash
npm run test:all
```

## Where Test Files Live

```text
tests/
  e2e/
  integration/
  support/
    locators/
```

Important support files:

- `tests/support/locators/LocatorBuilder.ts`
- `tests/support/locators/HtmlLocatorBuilder.ts`
- `tests/support/locators/PianoBingoLocatorBuilder.ts`

## Core Testing Rules

### 1. Use The Locator Builder

Do not write page-root selectors directly in test files.

Use the factory:

```ts
const app = pianoBingoLocator(page)
```

Then scope into the page or component you want:

```ts
await expect(app.welcomePage()).toBeVisible()
await app.welcomePage().action('new-game').click()
```

### 2. Import `expect` From The Locator Support Module

In Playwright specs for this repo, use:

```ts
import { expect, pianoBingoLocator } from '../support/locators'
```

Do not import `expect` from `@playwright/test` in E2E or integration specs.

Reason: the custom `expect` wrapper understands `LocatorBuilder` instances and automatically unwraps them to Playwright locators.

### 3. Prefer Structural Locators Over Text Locators

Good tests describe page structure and user intent.

Prefer:

- page roots
- structural containers like `header`, `body`, `list`, `footer`
- row or box ids such as `row-1` or `box-4`
- `data-action` hooks

Avoid relying on volatile text when the behavior is not specifically about text content.

## Locator System Overview

The locator abstraction has three layers.

### `LocatorBuilder`

Base wrapper around Playwright `Locator`.

It provides:

- `locate()` to access the raw Playwright locator
- chainable methods like `locator()`, `getByRole()`, `getByText()`, `filter()`, `nth()`
- common interactions like `click()`, `fill()`, `press()`, `setInputFiles()`
- `as()` for scoped blocks

### `HtmlLocatorBuilder`

Adds HTML-oriented helpers:

- `byAction(actionId)`
- `byTestId(testId)`
- `byClass(className)`
- `byTag(tagName)`
- `first()`, `second()`, `third()`, `fourth()`

### `PianoBingoLocatorBuilder`

Adds app-specific concepts:

- page roots: `welcomePage()`, `packSelectPage()`, `gamePage()`, `songManagementPage()`
- structural regions: `header()`, `footer()`, `pageBody()`, `list()`, `grid()`
- row and action hooks: `row(id)`, `action(actionId)`, `menuItem(actionId)`
- feature helpers: `packRadioInputs()`, `startGameButton()`, `nextSong()`, `pdfCanvas()`, `backButton()`

The factory function is:

```ts
const app = pianoBingoLocator(page)
```

It starts from the page body and returns a `PianoBingoLocatorBuilder`.

## Why The Locator Builder Exists

The builder keeps tests stable as the UI evolves.

Benefits:

- centralizes selector logic
- keeps selectors consistent across specs
- reduces copy-paste raw selectors
- makes tests read like UI workflows instead of DOM trivia
- allows refactors in one place when markup changes

## Locator Examples

### Example: Enter A Page And Click An Action

```ts
import { test } from '@playwright/test'
import { expect, pianoBingoLocator } from '../support/locators'

test('start new game from welcome page', async ({ page }) => {
  const app = pianoBingoLocator(page)

  await page.goto('/')
  await expect(app.welcomePage()).toBeVisible()
  await app.welcomePage().action('new-game').click()
  await expect(app.packSelectPage()).toBeVisible()
})
```

### Example: Work Inside A Structured List

```ts
const songManagement = app.songManagementPage()
await expect(songManagement.list()).toBeVisible()
await expect(songManagement.row(1)).toBeVisible()
await songManagement.action('delete-song-1').click()
```

### Example: Scope Through Layout Structure

```ts
const row = app.songManagementPage().pageBody().list().row(1)
await expect(row).toBeVisible()
await row.click()
```

### Example: Use Positional Helpers

```ts
const packSelect = app.packSelectPage()
await packSelect.packRadioInputs().first().click()
await packSelect.startGameButton().click()
```

### Example: Use A Scoped Block With `as()`

```ts
await app.songManagementPage().list().first().as(async (row) => {
  await expect(row).toBeVisible()
  await row.click()
})
```

### Example: Assert On Game History Boxes

```ts
const history = app.gameHistoryPage()
await expect(history.boxes()).toHaveCount(75)
await expect(history.box(1)).toBeVisible()
```

## Page And Element Naming Conventions

### Page Roots

Each route-level page should expose a root `data-testid` in this format:

```text
{kebab-name}-page
```

Examples:

- `welcome-page`
- `pack-select-page`
- `game-page`
- `song-management-page`

### Locator Method Naming

Use page-oriented names like:

- `app.welcomePage()`
- `app.packSelectPage()`
- `app.gamePage()`

Do not introduce older-style names like:

- `app.pageWelcome()`
- `app.pageGame()`

### Common Structural Test IDs

These are used repeatedly across pages and components:

- `header`
- `body`
- `footer`
- `list`
- `grid`
- `menu`
- `menu-wrapper`
- `menu-toggle`
- `primary-action`
- `empty-state`

Repeated items often use patterns like:

- `row-<id>`
- `option-<id>`
- `box-<n>`

Action hooks use `data-action`, for example:

- `new-game`
- `start-game`
- `next-song`
- `game-history`
- `back`

## Recommended Test Style

### Prefer Behavior-Focused Structure

Good:

```ts
await app.welcomePage().action('manage-songs').click()
await expect(app.songManagementPage()).toBeVisible()
```

Bad:

```ts
await page.locator('[data-testid="welcome-page"] [data-action="manage-songs"]').click()
```

### Prefer Page Objects Through The Builder, Not Ad-Hoc Selectors

If a selector pattern is reused, add a builder method instead of repeating raw selector strings in multiple specs.

### Keep Tests Path-Light When Possible

Prefer navigating through the UI rather than deep-linking directly to routes unless the test specifically targets route behavior.

## Seeding And State Setup

Many tests seed IndexedDB directly in the browser context.

Important rules:

- wrap IndexedDB writes in a `Promise`
- resolve on `tx.oncomplete`
- do not rely on implicit transaction ordering
- remember that loading the welcome page alone does not trigger automatic database seeding

Example pattern:

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

      const songStore = tx.objectStore('songs')
      const packStore = tx.objectStore('packs')

      for (const song of payload.songs) songStore.put(song)
      for (const pack of payload.packs) packStore.put(pack)
    }
  })
}, payload)
```

## Common Pitfalls

### `page.waitForTimeout()`

Avoid fixed sleeps. Prefer:

- `expect(...).toBeVisible()`
- `expect(async () => { ... }).toPass()`
- `page.waitForFunction()` for synchronous browser-side conditions

### `page.waitForFunction()` With Promises

`page.waitForFunction()` does not await a returned Promise. If you need Promise-based polling inside the browser context, use `page.evaluate()` inside a `toPass()` block.

### Console Listener Timing

If a test needs browser console output, register `page.on('console', ...)` before `page.goto()`.

### Service Worker Activation

Service worker activation can temporarily destroy the execution context. In offline or preload tests, treat `Execution context was destroyed` as a retryable transient failure rather than immediate proof of a broken feature.

## When To Extend The Locator Builder

Add a new builder method when:

- the same selector pattern appears in multiple tests
- a page or component exposes a meaningful domain concept
- a raw selector makes tests harder to read

Examples of good builder additions:

- a repeated menu item lookup
- a row-scoped action pattern
- a page-specific element that appears in many tests

Keep generic helpers in `HtmlLocatorBuilder` and app-specific helpers in `PianoBingoLocatorBuilder`.

## Practical Workflow For New E2E Coverage

1. Identify the user flow you want to verify.
2. Start from `const app = pianoBingoLocator(page)`.
3. Navigate through page-root methods.
4. Reuse structural helpers like `header()`, `list()`, `row(id)`, `action(id)`.
5. Seed state explicitly if the scenario depends on specific data.
6. Add new locator-builder methods if the spec would otherwise duplicate selectors.

## Reference Specs

Useful examples in the repo:

- `tests/e2e/core-workflow-smoke.spec.ts`
- `tests/e2e/song-management-crud.spec.ts`
- `tests/integration/offline-pdf-caching.spec.ts`

## Related Documentation

- Project overview: [../README.md](../README.md)
- Developer guide: [README.md](README.md)
- Agent testing rules: [../.github/instructions/testing.instructions.md](../.github/instructions/testing.instructions.md)