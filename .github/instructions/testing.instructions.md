---
applyTo: "tests/**"
---

# PianoBingo — Testing Instructions

## Test structure

| Directory | Framework | Purpose |
|---|---|---|
| `tests/e2e/` | Playwright | UI workflows — full user flows |
| `tests/integration/` | Playwright | DB / SW / storage interactions |
| `tests/unit/` | Jest | Logic, utilities, architecture constraints |

Run commands:
```
npm run test:all     # Jest + Playwright
npm run test:e2e     # Playwright only
```

`playwright.config.ts` uses `testMatch: ['**/e2e/**/*.spec.ts', '**/integration/**/*.spec.ts']` — unit tests are excluded from Playwright runs.

---

## Locator architecture

Tests use a custom builder system in `tests/support/locators/`. All locators flow through this builder — never write raw selectors directly in test files.

Guiding principle: tests should describe page structure and user intent, not implementation accidents or volatile copy.

### Class layers
1. `LocatorBuilder` — wraps Playwright `Locator`; chainable wrapper methods; exposes `.locate()` getter
2. `HtmlLocatorBuilder` — adds `.first()`, `.second()`, `.third()`, `.fourth()`, `.as(async scoped => {...})`
3. `PianoBingoLocatorBuilder` — domain methods: `welcomePage()`, `packSelectPage()`, `gamePage()`, etc.

### Builder invariants
- Builder methods must be immutable: each chain step returns a new builder and must not mutate prior scope.
- If a needed operation is missing, add it to the builder layer instead of escaping to raw Playwright in test files.

### Factory
```ts
const app = pianoBingoLocator(page)
await app.packSelectPage().startGameButton().click()
```

### `expect` wrapper
Because tests operate on builders, import `expect` from `tests/support/locators/` in E2E files:
- If value is a `LocatorBuilder`, it auto-calls `.locate()` before delegating to Playwright.
- Never import `expect` from `@playwright/test` in E2E spec files.

---

## Naming conventions

### Page root `data-testid` values
Format: `{kebab-name}-page`

| Page | testid |
|---|---|
| WelcomePage | `welcome-page` |
| PackSelectPage | `pack-select-page` |
| GamePage | `game-page` |
| GameHistoryPage | `game-history-page` |
| PackManagementPage | `pack-management-page` |
| PackEditPage | `pack-edit-page` |
| SongManagementPage | `song-management-page` |
| SongViewPage | `song-view-page` |

### Locator method naming
- **Correct**: `app.gamePage()`, `app.welcomePage()`
- **Wrong**: `app.pageGame()`, `app.pageWelcome()` — old convention, do not use

### Structural container testids (generic, used inside pages)
- `header`, `body`, `footer`, `list`, `grid`, `menu`, `menu-wrapper`, `menu-toggle`, `primary-action`
- `row-<id>`, `option-<id>`, `box-<n>`
- Within rows: `input`, `name`, `handle`, `checkbox`, `empty-state`

### Data action attributes
- `data-action="new-game"`, `data-action="start-game"`, `data-action="next-song"`, `data-action="game-history"`, etc.

### Component-owned IDs rule
- Prefer generic structural IDs defined inside reusable components rather than passed as page-specific props.
- Good: `Header -> header`, `PageLayout body -> body`, `PlaylistContainer -> list`, `PrimaryActionFooter -> primary-action`.
- Avoid page-specific variants like `game-history-header` when the component role is already clear.

---

## Selector rules

- Never write raw `[data-testid="..."]` in tests for page roots — always use the locator builder method.
- Scope repeated action testids (e.g. `next-song`) to a structural container in the builder to avoid Playwright strict-mode collisions.
- Prefer structural row/action hooks over song-title text selectors.
- Avoid `:first-of-type` CSS pseudo-selectors; use Playwright's `.first()`.
- Use `getByRole()` for accessible elements (buttons, links, inputs) where appropriate.
- Prefer `data-testid` and `data-action` first; use text assertions only when the business rule is specifically about text.
- Keep selector exceptions explicit and rare.

---

## Playwright pitfalls

- Register `page.on('console', ...)` **before** `page.goto()` to capture initialization messages.
- Replace `page.waitForTimeout()` with `page.waitForFunction()` or auto-retrying `expect(...).toBeVisible()`.
- Console listener race: use `expect(async () => { ... }).toPass({ timeout })` to poll for messages.
- Direct URL navigation can be less reliable than in-app flows; keep tests path-independent where possible.

---

## Seed helpers

- Wrap all IndexedDB operations in a `Promise` with `tx.oncomplete` as the resolve trigger.
- Never rely on implicit IDB completion ordering.

---

## Structural addressing pattern

Tests should navigate down a structural chain, not rely on volatile text content:

```
page → body → list → row(id) → action element
```

Example:
```ts
const row = app.songManagementPage().body().list().row(songId)
await row.name().click()
```

For repeated structures, use scoped blocks to keep names short and local:

```ts
await app.songManagementPage().body().list().first().as(async (row) => {
	await expect(row.name()).toBeVisible()
	await row.click()
})
```

This pattern:
- Survives copy/text changes
- Validates real UI structure
- Is readable as a description of page layout

Expected outcome:
- lower flakiness
- faster locator refactors
- better cross-page consistency
- tests that read like UI behavior specifications

---

## Known deferred coverage gaps

These require invasive changes or browser mocking and are intentionally not yet tested:
- `setSongPdf` with malformed base64
- `firstTimeOpeningDB` concurrent-call race
- DB schema migration (no migration code exists yet)
- Swipe gesture navigation on PDF viewer
- Offline mid-game reload + state resume (partially covered by `offline-pdf-caching.spec.ts`)
