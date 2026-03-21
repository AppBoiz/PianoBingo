# PianoBingo — Coding Agent Context

Last updated: 2026-03-21

## 0) Meta: Keeping this context file current

**Active maintenance required**: As you (the coding agent) work on this project, update this file when architecture, implementation patterns, or migration status changes materially. Do not let this context drift from reality.

**Communication style for this project**:
- Keep chat responses and status updates short and snappy in the conversation.
- Do NOT create separate `.md` summary/report files unless explicitly requested.
- If something is important enough for long-term reference, add it directly to this context file.
- If this file grows too large, we'll create a structured documentation library at that time.

**Documentation file management**:
- When analysis/audit reports or other documentation MUST be created as separate .md files, save them to `docs/agent/` directory alongside this context file.
- Keep root directory clean - README.md is the only .md file that should remain in project root.
- Use descriptive filenames with uppercase and underscores (e.g., `TEST_COVERAGE_ANALYSIS.md`, `MIGRATION_STATUS.md`).


## 1) Project purpose and product functionality

PianoBingo is an offline-capable web app for running song-draw games from configurable song packs, with local song/pack management and PDF viewing.

Core user workflows:
- Start game: Welcome → Pack Select → draw first song → PDF Reader gameplay.
- Gameplay: next/previous song, game history view, end game.
- Song administration: create/rename/delete songs, attach/remove PDF, preview song PDF.
- Pack administration: create/rename/delete packs, edit pack song list/order, enforce 75-song pack target.

Core entities:
- Song: `songId`, metadata (title), `pdfUrl` (blob/object URL), versioning fields.
- Song pack: `packId`, `packName`, `songs[]`.
- Game state/history: selected pack, current song, already-shown songs.


## 2) Current app architecture (finalized)

The active app surface is React + TypeScript with a page-centric structure.

- Entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Navigation context: `src/shared/context/NavigationContext.tsx`
- Route constants: `src/shared/constants/navigation.ts`

Source organization:
- `src/pages/{feature}/{PageName}/...` for page-owned code
- `src/pages/{feature}/hooks/*` for feature-scoped hooks
- `src/shared/*` for cross-feature reusable code
- `src/shared/services/*` for browser/runtime API service modules (see §4.5)

Current page entry files:
- `src/pages/game/GamePage/GamePage.tsx`
- `src/pages/game/GameHistoryPage/GameHistoryPage.tsx`
- `src/pages/game/PackSelectPage/PackSelectPage.tsx`
- `src/pages/packs/PackEditPage/PackEditPage.tsx`
- `src/pages/packs/PackManagementPage/PackManagementPage.tsx`
- `src/pages/songs/SongManagementPage/SongManagementPage.tsx`
- `src/pages/songs/SongViewPage/SongViewPage.tsx`
- `src/pages/welcome/WelcomePage/WelcomePage.tsx`

Page naming conventions:
- Every route-level page component and its folder ends in `Page` (e.g. `GamePage`, `PackSelectPage`).
- Page-specific header/footer organisms also end in `Page*` (e.g. `GamePageHeader`, `GamePageFooter`, `PackSelectPageHeader`, `PackManagementPageFooter`, `SongViewPageHeader`).
- `data-testid` on the root element of each page follows the format `{kebab-name}-page` (e.g. `game-page`, `pack-select-page`, `welcome-page`).
- Locator builder methods match: `app.gamePage()`, `app.packSelectPage()`, `app.welcomePage()`, etc.


## 3) Feature parity snapshot (important migration status)

- `WelcomePage`, `PackSelect`, `PackManagement`, `PackEdit`, `SongManagement`: high parity with legacy flows.
- `PdfReader`: **✅ Full parity achieved** - contextual UI, song title with pack index, hamburger menu, and footer button match legacy.
- `GameHistory`: **✅ Full parity achieved** - 75-box grid with highlighting and proper navigation.
- `SongView`: **✅ Full parity achieved** - preview mode navigation (back to Song Management with game reset), title-only header (no ID shown outside game context), no game controls.


## 4) Technical implementation details

### 4.1 Offline usage and caching

Build pipeline generates a Workbox service worker for production output:
- Build scripts: `npm run build` runs Vite build + `cp -r resources dist/resources` + `scripts/generate-sw-manifest.js` + `scripts/generate-workbox-sw.js`.
- **`resources/` must be in `dist/`**: Vite only copies `public/` automatically. The `resources/` folder (base64 PDFs, images, PDF files) is at the project root and is explicitly copied by the build script. Without this, all `fetch('/resources/...')` calls return 404 at runtime, `initializePreloadedData()` fails silently, `pdfMap` stays empty, and no PDF lookup-key like `'t2t9h8uF'` can ever resolve.
- Output SW: `dist/service-worker.js` (this is what production app registers from `src/main.tsx`).

Current runtime caching strategy (Workbox-generated):
- `assets-cache`: `CacheFirst` for `/assets/`.
- `pages-cache`: `NetworkFirst` for broad app/page requests.
- Workbox precache includes hashed build artifacts and generated SW manifest entries.
- `cleanupOutdatedCaches: true` automatically removes old cache names (e.g., `pianobingo-cache-v1` from manual SW) on activation.

**Deprecated service worker files:**
- `/service-worker.js` (root): Manual SW, no longer used. Production uses `dist/service-worker.js` generated by Workbox. Will be removed when legacy surface is retired.
- `src/sw-template.js`: Workbox template for `injectManifest()` approach, but build uses `generateSW()` instead. Unused, kept for reference only.

**Service worker registration:**
  - React app: `src/main.tsx` calls `registerProductionServiceWorker()` from `src/shared/services/runtime/serviceWorkerService.ts`, which wraps `navigator.serviceWorker.register('/service-worker.js')` with feature detection and error handling.
  - Legacy surface has been removed; SW registration is now React-only.

### 4.2 Local persistence and backward compatibility

- IndexedDB (`src/shared/storage/indexedDb.ts`) stores songs/packs and is designed to preserve legacy schema expectations.
- localStorage game state mirrors legacy helper model (`resources/state-helpers/gameStorage.js`) for continuity.
- **IDB seeding is lazy**: `openDB()` is the entry point for seeding — it runs once (guarded by `firstTimeOpeningDB`) and seeds packs/songs from `window.BASE_PACK_DATA` / `window.BASE_SONG_DATA`. However, `openDB()` is only called on the first actual IDB access from a React component (e.g. `loadAllPacks()` in `PackManagement`). Simply loading the welcome page does **not** trigger seeding.
- Compatibility-sensitive changes must preserve:
  - DB name/object store names/keys and migration behavior.
  - localStorage key names and expected field shapes.

### 4.2a Song ID concepts — IMPORTANT

There are two distinct numeric identifiers for songs. Always keep them separate:

| Concept | Field | Type | Usage |
|---|---|---|---|
| **Technical DB key** | `Song.songId` / `Pack.songs[]` entries | `number` | IndexedDB object store key; used in all `loadSong()` / `saveSong()` / `deleteSong()` calls and in `GameState.shownSongIds`. **Never display to the user.** |
| **Pack position** | 1-based index of song in `Pack.songs[]` | `number` (computed) | Meaningful only within a specific pack context. Shown in `PdfReader` game title and `PackEdit` drag-handle. **Do not show outside a game/pack context.** |

Rules:
- `PdfReader` (game context): show pack position in the title (`packData.songs.findIndex(id => id === song.songId) + 1`).
- `SongView` / `SongManagement` (management context, no active pack): show only the song title — no numeric ID of any kind.
- `GameHistory`: displays numbers 1–75 which are pack positions; uses `songId` only for internal `shownSongIds` comparison.
- `PackEdit`: uses `packPosition` (local variable, 1-based) for the drag-handle label; uses `songId` only for `data-song-id` attributes and DB calls.

### 4.3 PDF reader implementation

- React PDF rendering uses `pdfjs-dist` via dynamic import.
- `src/pages/game/hooks/usePdfSong.ts` centralizes the common song-loading flow used by both `GamePage` and `SongViewPage`: load a `Song`, derive `pdfUrl`/title state, expose loading state, and provide a `reload()` helper.
- PDF.js worker is initialized once (module-level singleton) in `src/shared/services/pdf/pdfDocumentService.ts` via `GlobalWorkerOptions.workerSrc`; component code never touches `GlobalWorkerOptions` directly.
- Base64 source resolution and legacy fallback loading are in `src/shared/services/pdf/pdfSourceService.ts`.
- Canvas creation and PDF page rendering are in `pdfDocumentService.ts`; `PDFViewer.tsx` delegates all DOM/PDF.js API calls to these services.
- PDF diagnostic flags (`window.__PDF_LOADED__`, `window.__PDF_RENDERED__`, `window.__PDF_RENDER_ERROR__`) are now written exclusively through `src/shared/services/runtime/windowGlobals.ts`.
- **PDF URL resolution flow**: Songs in IndexedDB store short variable-name keys (e.g. `'t2t9h8uF'`) as `pdfUrl`, not raw base64. `resolvePdfBase64()` in `pdfSourceService.ts` looks the key up in `pdfMap` (populated at boot by `initializePreloadedData()`). If the value already starts with `'JVBERi0'` (PDF base64 prefix), it is returned directly. This means both raw base64 and lookup keys are valid `pdfUrl` values.
- **The PDF viewer route is `/game` (or `/song-view/:id`)**: there is no `/pdf-reader` route in `src/App.tsx`. Tests or code that tries to navigate to `/pdf-reader` will get a 404/blank page.

### 4.5 Service layer — browser / runtime API boundaries

All raw browser and runtime API calls are encapsulated in dedicated service modules under `src/shared/services/`. Pages, hooks, and storage modules must go through these services rather than calling browser APIs directly.

| Service file | API encapsulated |
|---|---|
| `services/storage/indexedDbClient.ts` | `indexedDB.open()`, `IDBTransaction/IDBRequest` promise wrappers |
| `services/storage/localStorageService.ts` | `localStorage.getItem/setItem/removeItem` |
| `services/network/resourceLoader.ts` | `fetch()` (text resource loading) |
| `services/runtime/windowGlobals.ts` | `window.BASE_PACK_DATA/BASE_SONG_DATA/resolvePdfUrl`, PDF diagnostic flags |
| `services/runtime/serviceWorkerService.ts` | `navigator.serviceWorker.register()` |
| `services/runtime/fileReaderService.ts` | `FileReader` (file → data URL) |
| `services/runtime/frameMessaging.ts` | `window.parent.postMessage()` (legacy iframe navigation) |
| `services/runtime/domService.ts` | `document.getElementById()`, `querySelectorAll()` DOM reads |
| `services/pdf/pdfSourceService.ts` | `atob()`, base64 validation, legacy fetch fallback |
| `services/pdf/pdfDocumentService.ts` | `pdfjs-dist` dynamic import, worker setup, `getDocument()`, canvas render |
| `services/navigation/legacyNavigation.ts` | Page navigation via `postMessageToParent()` |

**Rule**: If adding code that calls a browser/runtime API (e.g. `localStorage`, `fetch`, `FileReader`, DOM manipulation), put the raw call in the appropriate service module and import from there. Do not call browser APIs from components, hooks, or storage modules directly.

### 4.6 Mobile compatibility

Mobile behavior currently depends heavily on inherited legacy CSS contracts:
- Full-height shell and constrained content panes.
- Sticky bottom actions on editing screens.
- Tight positional layout in headers/nav.

Do not refactor structure or selector names casually during migration; layout parity is fragile and selector-driven.

(Note: Section numbering shifted by 1 after §4.4 when §4.5 service layer was added. References to §4.4 in older notes now correspond to §4.6.)


## 5) Tech stack summary

- Framework/runtime: React 18, React Router 6, TypeScript.
- Build/dev server: Vite.
- Styling: page-owned legacy CSS imported by each route page; `styles.css` remains only for the legacy HTML shell.
- Offline/PWA: Service Worker (Workbox-generated in build), web app manifest.
- Data/storage: IndexedDB + localStorage.
- PDF rendering: `pdfjs-dist`.
- Drag reorder: `sortablejs`.
- Testing: Playwright E2E + integration (`tests/e2e/`, `tests/integration/`), Jest unit (`tests/unit/`). Run with `npm run test:all`.


## 6) Deployment model and steps (GitHub Pages/static hosting)

### 6.1 Standard build/deploy flow

1. Install: `npm install`
2. Build: `npm run build`
3. Deploy contents of `dist/` to static host (GitHub Pages or equivalent).

Local validation helpers:
- Dev: `npm run dev`
- Preview built app: `npm run preview`
- E2E offline smoke: `npm run test:e2e`

### 6.2 Hosting constraints to preserve

- Current app references several root-absolute paths (`/service-worker.js`, `/manifest.json`, some `/resources/...` paths).
- This works best when hosted at domain root (custom domain + root publish).
- If deploying under a subpath (`/<repo>/`), audit route base/SW scope/asset paths carefully before rollout.


## 7) Styling system and visual constraints

Styling architecture is parity-oriented and page-owned:
- React route pages import their matching CSS from `src/styles/legacy/*`
- `styles.css` remains only for the old iframe-based legacy shell in `public/legacy-index.html`
- Avoid app-wide CSS imports in `src/main.tsx`; route pages own their styling

Observed visual conventions:
- Primary accent pink family (e.g., `#F14D8A` and darker hover variants).
- White cards/surfaces, subtle gray text and separators.
- Rounded corners, soft shadows, high-contrast CTA buttons.
- Inter/Arial-like sans typography.

Migration rule: keep DOM/class/id contracts aligned with legacy CSS until each page has tested visual parity (desktop + mobile).


## 8) Migration guardrails (critical)

1. **Behavior parity first, cleanup second**
   - Preserve user-visible workflow semantics while migrating internals.

2. **Do not break cache/storage continuity**
   - Keep legacy DB/localStorage compatibility and avoid unintended cache namespace churn.

3. **Treat SW as a single source of truth**
   - Prefer generated Workbox path for production; document and eventually remove deprecated SW codepaths.

4. **Preserve legacy styling contracts during page migration**
   - Avoid renaming/removing legacy selectors without explicit parity validation.

5. **Verify mobile and offline after each substantial page migration**
   - At minimum run targeted local checks and `tests/offline-pdf.spec.ts` where relevant.


## 9) Known risks / hotspots

- Multiple SW implementations in repo can cause confusion and drift.
- Legacy and React defaults for some game-state fields have been aligned (currentSong.songId, selectedSongPackId null default).
- Root-absolute URL assumptions can break non-root static deployments.


## 10) Recommended reusable subagents for future work

Use the following focused subagents when working on this app:

1. **Parity Auditor (React vs Legacy)**
   - Compares each `src/pages/*` flow with corresponding `public/legacy-pages/*` behavior.
   - Output: parity checklist with blockers and acceptance criteria.

2. **Offline/Cache Safety Auditor**
   - Traces SW generation/runtime caching, precache manifest, cache names, and invalidation behavior.
   - Output: risk report + safe rollout plan for cache-affecting changes.

3. **Storage Compatibility Auditor**
   - Validates IndexedDB + localStorage schema/keys/defaults against legacy assumptions.
   - Output: migration impact matrix and required data migrations.

4. **Mobile Layout Parity Auditor**
   - Checks migrated pages for selector/structure parity and viewport behavior (sticky controls, scroll containers, header geometry).
   - Output: CSS/DOM diff checklist prioritized by UX impact.

5. **PDF Pipeline Auditor**
   - Validates modern bundled PDF worker/chunks, offline rendering path, and legacy fallback behavior.
   - Output: failure modes + remediation sequence.

6. **Static Deploy Auditor (GitHub Pages)**
   - Checks base path assumptions, service worker scope, manifest/icon paths, route refresh behavior, and CNAME handling.
   - Output: deploy checklist for root-hosted vs subpath-hosted scenarios.


## 11) Suggested “Definition of Done” for migration PRs

Each migration PR should include:
- Feature parity notes for affected page(s) vs legacy behavior.
- Offline/cache impact statement (or explicit “no impact” with rationale).
- Storage compatibility statement (keys/schema/defaults unchanged or migration included).
- Mobile screenshots (or diff tool output) where layout changed.
- Test evidence (targeted checks + relevant Playwright run).


## 12) Migration status

**Migration is complete.** The app is 100% React/TypeScript. Legacy surface was removed in early 2026.

Key facts:
- All pages migrated and at parity with legacy behavior.
- Service worker: Workbox-generated only (`dist/service-worker.js`), `cleanupOutdatedCaches: true`.
- `src/styles/legacy/` contains essential CSS for current React pages — do not delete.
- `SongView` navigation uses React Router search params (`/song-view?songId=<id>`) — no game state pollution.
- Test suite: 91 tests (Jest unit + Playwright E2E/integration) all passing.
- Locator builder pattern: `expect` and `pianoBingoLocator` exported from `tests/support/locators/`; never import `expect` from `@playwright/test` in E2E tests.

---

## 13) Confirmed project decisions

1. **Legacy files**: Kept only until migration complete, then removed.
2. **Deployment**: Root-only hosting (custom domain at domain root); no subpath GitHub Pages support needed.
3. **Service worker consolidation**: Manual SW files should be retired once migration validated.
4. **Design modernization**: Allow controlled improvements per page, but structure/core styling must remain close to original. Mobile behavior and offline characteristics are non-negotiable.
