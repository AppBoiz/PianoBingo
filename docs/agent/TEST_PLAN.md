# PianoBingo Test Plan

**Date**: 2026-03-18  
**Status**: Implemented  
**Source**: Three-subagent deep audit (test critique, app logic, services/storage/offline/mobile)

---

## 1. Existing Test Inventory

| File | Framework | Count | Verdict |
|------|-----------|-------|---------|
| `tests/parity-smoke.spec.ts` | Playwright | 14 tests | Keep with fixes |
| `tests/game-history.spec.ts` | Playwright | 3 tests | Keep with fixes |
| `tests/indexed-db-init.spec.ts` | Playwright | 2 tests | 1 fixed, 1 deleted |
| `tests/storage-compatibility.spec.ts` | Playwright | 3 tests + 1 skipped | Keep (skipped remains) |
| `tests/offline-pdf.spec.ts` | Playwright | 1 test | Keep |
| `tests/mobile-viewport.spec.ts` | Playwright | 4 tests | Keep |
| `tests/unit/architecture/architecture.test.ts` | Jest | multiple | Keep |
| `tests/unit/navigation.constants.test.ts` | Jest | multiple | Keep |

---

## 2. Critical Fixes Applied

### 2a. Broken import path (`parity-smoke.spec.ts`, `game-history.spec.ts`)
- **Bug**: `import { PACK_SIZE } from '../src/constants/game'` — path did not exist
- **Fix**: Changed to `'../src/shared/constants/game'`

### 2b. Hardcoded port (`indexed-db-init.spec.ts`)
- **Bug**: Two `page.goto('http://localhost:5175')` calls — hardcoded port bypasses Playwright's `baseURL` config (actual dev port is 3000)
- **Fix**: Changed to `page.goto('/')` — lets Playwright resolve against `baseURL`

---

## 3. Tests Deleted

| Test | File | Reason |
|------|------|--------|
| "Pack select page displays preloaded packs" | `indexed-db-init.spec.ts` | Sole assertion is `expect(await page.locator('body').isVisible()).toBe(true)` — always true, tests nothing |
| "navigate to pack management" | `parity-smoke.spec.ts` | Only checks text visibility after navigation; fully redundant with the complete-workflow test in the same file |
| "app functions offline (smoke test)" | `parity-smoke.spec.ts` | Sets the browser offline but immediately goes back online then checks welcome page loads — proves nothing about offline functionality |

---

## 4. Selector Improvements

Fragile selectors replaced across `parity-smoke.spec.ts`, `game-history.spec.ts`, and `mobile-viewport.spec.ts`:

| Old selector | New selector | Reason |
|---|---|---|
| `page.click('input[type="radio"]:first-of-type')` | `page.locator('input[type="radio"]').first().click()` | `:first-of-type` is CSS-specificity sensitive; Playwright's `.first()` is intent-clear |
| `page.click('button >> text=‹')` | `page.getByRole('button', { name: '‹' }).click()` | Role-based locator survives class/markup changes |
| `page.click('.menu >> text=Game History')` etc. | `page.locator('.menu').getByText('…').click()` | Scoped text search; clearer intent |
| `page.evaluate(() => history.pushState…)` for routing | `page.goto('/game-history')` | Avoids brittle pushState hack; tests actual URL routing |

---

## 5. Source Bug Fixed

### GameMenu hamburger close-on-click (`src/pages/game/Game/molecules/GameMenu.tsx`)
- **Bug**: After clicking a menu action, the `#menu-toggle` checkbox remained checked, leaving the menu open
- **Fix**: `handleActionClick` now unchecks `#menu-toggle` before calling the action

---

## 6. New Tests Added (`tests/edge-cases.spec.ts`)

These cover app-logic risks identified in the deep audit that had zero test coverage:

| Test | Risk Covered |
|------|------|
| Direct `/game` navigation without game state renders without crash | RISK 1.1 — no route guards |
| Direct `/game-history` without game state shows "No active game" | RISK 1.3 — graceful handling already present; now verified by URL navigation (not pushState) |
| Direct `/pack-edit/9999` with invalid packId renders gracefully | RISK 1.4 / missing coverage |
| Single-song pack exhaustion — advancing past last song doesn't crash | RISK 1.5 — silent null from `generateSong()` |
| Hamburger menu closes after item click (mobile viewport) | BUG — menu never unchecked; covered by GameMenu fix |
| Deleting the currently-playing song, then returning to game — handled gracefully | RISK 4.2 — orphaned songId |
| Deleting the active game pack, then returning to game — handled gracefully | RISK 4.3 — pack removed mid-game |

---

## 7. Coverage Gaps Not Yet Addressed (Future Work)

These risks were identified but not yet tested (require more invasive app changes or mocking):

| Gap | Why Deferred |
|------|------|
| `setSongPdf` with malformed base64 stored silently | Requires mocking IndexedDB write path or a deliberate upload flow |
| `firstTimeOpeningDB` concurrent-call race condition | Requires controlled timing/Promise coordination in browser context |
| `frameMessaging` `document.referrer` empty fallback to `'*'` | Requires embedding app in iframe test harness |
| Swipe gesture navigation on PDF viewer | Requires pointer event simulation; no swipe support exists yet in source |
| DB schema migration path when `DB_VERSION` increments | No migration code exists; test would need to pre-seed v1 and verify v2 opens correctly |
| Offline mid-game reload retains game state | `offline-pdf.spec.ts` partially covers this; needs explicit reload-while-offline + resume |
