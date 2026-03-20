# PianoBingo UI Testing Concept

Date: 2026-03-20

## Goal

PianoBingo UI tests should locate elements by **relative page structure**, not mainly by volatile text content.

The intent is to make tests:
- Stable against copy/text changes
- Clear to read (the test describes page structure)
- Consistent across pages
- Maintainable as UI evolves

## Core Principle: Relative Structural Addressing

Tests should navigate down a structural chain, for example:

1. Page
2. Page body/content
3. Table/List/Grid container
4. Row/item within container
5. Column/cell/field within row
6. Action element (button/link/input)

Example reading style:
- `page -> body -> song list -> first row -> name field -> edit button`

The `body` scoping step is optional when page-level scope already gives sufficient specificity.

This validates real UI structure and avoids brittle selectors.

## Selector Strategy

### Primary

Use `data-testid` (and `data-action` for intent-driven actions) as the default.

### Secondary

Use role, tag, class, or text selectors only when they are the best semantic fit.

### Guideline

Prefer reusable IDs:
- A column concept like `id` can be reused in many rows.
- Differentiation comes from relative scope (which row/container), not unique literal strings.

## Component-Owned IDs Rule

Where possible, structural IDs should be set inside reusable components, not passed from usage sites.

- Good:
  - `Header` always renders `data-testid="header"`
  - `PageLayout` body always renders `data-testid="body"` (except when `skipMainWrapper` is passed — e.g. `GameHistory` uses this)
  - `PlaylistContainer` always renders `data-testid="list"`
  - `PrimaryActionFooter` button always renders `data-testid="primary-action"`
  - `EditableTextInput` always renders `data-testid="input"`

- Avoid:
  - passing page-specific `testId` props like `game-history-header`, `song-management-header`, etc. when the component role is already known.

Rationale:
- Lower prop noise in page code
- More uniform selectors across routes
- Easier bulk refactors in test and locator code

## Reusable Test-ID Taxonomy

Use a small, consistent vocabulary:

- Page scope (intentionally specific):
  - `page-welcome`
  - `page-pack-select`
  - `page-game`
  - `page-game-history`
  - `page-pack-management`
  - `page-pack-edit`
  - `page-song-management`
  - `page-song-view`

- Structural containers (generic):
  - `header`
  - `body` *(rendered by `PageLayout` unless `skipMainWrapper` is set)*
  - `list`
  - `grid`
  - `footer`
  - `menu`
  - `menu-wrapper`
  - `menu-toggle`
  - `menu-toggle-checkbox`
  - `primary-action`

- Repeating items:
  - `option-<id>`
  - `row-<id>`
  - `box-<n>`

- Fields/cells (relative to row/container):
  - `input`
  - `name`
  - `handle`
  - `checkbox`
  - `empty-state`

- Actions:
  - `data-action="new-game"`
  - `data-action="start-game"`
  - `data-action="next-song"`
  - `data-action="game-history"`
  - etc.

## Locator Builder Architecture

Use composition (not inheritance from Playwright internal classes) because Playwright `Locator` is not designed as a public base class.

### Class Layers

1. `LocatorBuilder`
- Wraps Playwright `Locator`
- Implements chainable wrapper methods over core locator operations
- Always returns a **new builder** instance for chain methods
- Exposes `locate()` getter for interoperability

2. `HtmlLocatorBuilder`
- Adds generic DOM navigation helpers
- Adds cardinal helpers:
  - `first()`
  - `second()`
  - `third()`
  - `fourth()`
- Adds useful scope helper:
  - `as(async (scoped) => { ... })`

3. `PianoBingoLocatorBuilder`
- Adds domain-specific methods:
  - `pageWelcome()`
  - `pagePackSelect()`
  - `pageGame()`
  - `pageGameHistory()`
  - `list()`
  - `row(id)`
  - `menu()`
  - etc.

## Immutability Requirement

Builder methods must not mutate internal locator state.

Each chain step returns a new object:
- Good: `const row1 = table.first(); const row2 = table.second();`
- Bad: mutating `table` so `row2` becomes relative to `row1`

This avoids accidental chain pollution.

## Wrapped Expect

Playwright `expect()` expects a Playwright `Locator`.

Because tests operate on builders, provide a wrapper:
- `pianoExpect(value)`
- If `value` is a `LocatorBuilder` (or subclass), call `value.locate()`
- Otherwise pass value through

This allows ergonomic assertions while preserving strong abstractions.

## Factory Function

Provide a root factory:
- `pianoBingoLocator(page)` -> returns `PianoBingoLocatorBuilder`

Usage:

```ts
const app = pianoBingoLocator(page)
await app.pagePackSelect().startGameButton().click()
```

## Readability Pattern with Scoped Blocks

For repeated structures, use `as` to scope reusable names:

```ts
const table = app.pageBody().songList()
await table.rows().first().as(async (row) => {
  await pianoExpect(row.songNameInput()).toBeVisible()
  await row.deleteButton().click()
})
```

This avoids noisy variable naming like `row1Column1`, `row2Column1`.

## Migration Rules for Existing Tests

1. Replace raw selectors with builder methods
2. Keep tests structural and intent-driven
3. Avoid direct text assertions unless business logic requires text validation
4. Prefer `data-testid` and `data-action` first
5. Keep selector exceptions explicit and rare
6. Prefer component-owned generic IDs for reusable structures
7. Keep page-root IDs specific; keep inner structure generic

## Expected Outcomes

After migration:
- Lower test flakiness
- Faster selector refactors
- Better consistency across desktop/mobile tests
- Tests that read like UI behavior specifications
