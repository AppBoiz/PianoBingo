# PianoBingo — Copilot Workspace Instructions

## Communication style
- Keep chat responses short and snappy.
- Do NOT create separate `.md` summary/report files unless explicitly requested.
- If something is important for long-term reference, add it directly to `docs/agent/CODING_AGENT_CONTEXT.md`.
- Analysis/audit reports that must be separate files go in `docs/agent/`.
- Treat `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` as the authoritative machine-readable source for Copilot behavior.
- Treat `docs/agent/` as deeper human reference only; avoid duplicating normative rules there.

---

## Project overview

PianoBingo is an offline-capable PWA for running song-draw bingo games from configurable song packs, with local song/pack management and PDF viewing.

Core user workflows:
- Start game: Welcome → Pack Select → draw first song → PDF Reader gameplay.
- Gameplay: next/previous song, game history, end game.
- Song admin: create/rename/delete songs, attach/remove PDF, preview song PDF.
- Pack admin: create/rename/delete packs, edit song list/order, enforce 75-song target.

---

## Architecture

### Entry points
- `src/main.tsx` — app entry, calls `initializePreloadedData()` synchronously before React mounts
- `src/App.tsx` — React Router routes
- `src/shared/context/NavigationContext.tsx` — navigation context
- `src/shared/constants/navigation.ts` — route constants

### Page files
```
src/pages/game/GamePage/GamePage.tsx
src/pages/game/GameHistoryPage/GameHistoryPage.tsx
src/pages/game/PackSelectPage/PackSelectPage.tsx
src/pages/packs/PackEditPage/PackEditPage.tsx
src/pages/packs/PackManagementPage/PackManagementPage.tsx
src/pages/songs/SongManagementPage/SongManagementPage.tsx
src/pages/songs/SongViewPage/SongViewPage.tsx
src/pages/welcome/WelcomePage/WelcomePage.tsx
```

### Source layout
- `src/pages/{feature}/{PageName}/` — page-owned code
- `src/pages/{feature}/hooks/` — feature-scoped hooks
- `src/shared/` — cross-feature reusable code
- `src/shared/services/` — all browser/runtime API calls

---

## Coding conventions

### Naming
- Route-level page component, folder, and exported function all end in `Page` (e.g. `GamePage`, `PackSelectPage`).
- Page-specific header/footer organisms also end in `Page*` (e.g. `GamePageHeader`, `GamePageFooter`).
- `data-testid` on the root element follows `{kebab-name}-page` (e.g. `game-page`, `pack-select-page`).
- Locator builder methods: `app.gamePage()`, `app.welcomePage()`, etc. — never `.pageXxx()`.

### Types
- Shared domain types live in `src/shared/types/` — `Song`, `Pack`, `CurrentSong`, `GameState`, `IndexedDbConfig`.
- Window globals for preload/PDF diagnostics are declared in `src/types/global.d.ts`.
- Never declare local `Song`/`Pack` interfaces in page components; always import from shared types.

### Hooks and abstraction
- Hooks in `src/hooks/` must be genuinely reusable across multiple components.
- Non-reusable page logic belongs in the component itself, not extracted into a one-off hook.
- Do not create one large hook that owns a whole page's logic.
- Keep page-specific algorithms as named local helpers in the page file; do not extract to shared utils unless reused in multiple places.
- Prefer simple, visible code over abstraction. Use named functions and clear variable names.

### Service layer boundary (critical)
All raw browser/runtime API calls go through dedicated service modules in `src/shared/services/`. Pages, hooks, and storage modules must never call browser APIs directly.

| Service file | API encapsulated |
|---|---|
| `services/storage/indexedDbClient.ts` | `indexedDB.open()`, IDB promise wrappers |
| `services/storage/localStorageService.ts` | `localStorage` |
| `services/network/resourceLoader.ts` | `fetch()` |
| `services/runtime/windowGlobals.ts` | `window.BASE_PACK_DATA/BASE_SONG_DATA`, PDF diagnostic flags |
| `services/runtime/serviceWorkerService.ts` | `navigator.serviceWorker.register()` |
| `services/runtime/fileReaderService.ts` | `FileReader` |
| `services/runtime/domService.ts` | `document.getElementById()`, `querySelectorAll()` |
| `services/pdf/pdfSourceService.ts` | `atob()`, base64 validation, legacy fetch fallback |
| `services/pdf/pdfDocumentService.ts` | `pdfjs-dist`, worker setup, `getDocument()`, canvas render |

---

## Song ID concepts — IMPORTANT

Two distinct numeric identifiers exist; never conflate them:

| Concept | Field | Usage |
|---|---|---|
| **Technical DB key** | `Song.songId` | IndexedDB key; used in all DB calls and `GameState.shownSongIds`. **Never display to users.** |
| **Pack position** | 1-based index in `Pack.songs[]` | Shown in PdfReader game title and PackEdit drag-handle only. |

- `PdfReader` (game context): show pack position in title (`packData.songs.findIndex(id => id === song.songId) + 1`).
- `SongView` / `SongManagement` (management context): show only the song title — no numeric ID at all.
- `GameHistory`: boxes 1–75 are pack positions; `songId` is internal only.
- `PackEdit`: `packPosition` is the drag-handle label; `songId` for data attributes and DB calls only.

---

## PDF notes

- PDF viewer route is `/game` (or `/song-view/:id`) — there is **no** `/pdf-reader` route.
- PDF.js worker initialized once (module-level singleton) in `pdfDocumentService.ts`; never touch `GlobalWorkerOptions` in component code.
- Songs store short lookup keys (e.g. `'t2t9h8uF'`) as `pdfUrl`, not raw base64. `resolvePdfBase64()` in `pdfSourceService.ts` resolves them via `pdfMap` (populated at boot by `initializePreloadedData()`).

---

## Tech stack

- React 18, React Router 6, TypeScript
- Vite (build/dev), Tailwind + PostCSS (styling), legacy per-page CSS in `src/styles/legacy/`
- IndexedDB + localStorage for persistence
- Service Worker: Workbox-generated (`dist/service-worker.js`); `cleanupOutdatedCaches: true`
- `pdfjs-dist` for PDF rendering, `sortablejs` for drag reorder
- Testing: Playwright (`tests/e2e/`, `tests/integration/`), Jest (`tests/unit/`)

### Commands
```
npm run dev          # dev server
npm run build        # production build (Vite + resources copy + Workbox SW)
npm run preview      # preview production build
npm run test:all     # run all tests (Jest + Playwright)
npm run test:e2e     # Playwright only
```

---

## Build / deploy notes

- `resources/` is explicitly copied to `dist/` by the build script (Vite only auto-copies `public/`).
- App assumes root-absolute paths (`/service-worker.js`, `/manifest.json`, `/resources/...`). Works best at domain root; subpath deploys need careful auditing.

---

## Styling

- Tailwind base: `src/styles/tailwind.css`
- Global look-and-feel: `styles.css`
- Page CSS (ported from original app, still essential): `src/styles/legacy/*.css`
- Primary accent: pink family (`#F14D8A`). White cards, gray separators, rounded corners, high-contrast CTAs.
- Do not rename/remove legacy CSS selectors without explicit visual parity validation.

---

## Deeper reference

For detailed implementation notes, migration history, and architectural rationale, see:
[docs/agent/CODING_AGENT_CONTEXT.md](../docs/agent/CODING_AGENT_CONTEXT.md)
