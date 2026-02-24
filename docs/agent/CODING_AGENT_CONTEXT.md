# PianoBingo — Coding Agent Context

Last updated: 2026-02-24

## 0) Meta: Keeping this context file current

**Active maintenance required**: As you (the coding agent) work on this project, update this file when architecture, implementation patterns, or migration status changes materially. Do not let this context drift from reality.

**Communication style for this project**:
- Keep chat responses and status updates short and snappy in the conversation.
- Do NOT create separate `.md` summary/report files unless explicitly requested.
- If something is important enough for long-term reference, add it directly to this context file.
- If this file grows too large, we'll create a structured documentation library at that time.


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


## 2) Current app architecture (React + legacy coexistence)

There are two application surfaces in the repository:

1. **React/TypeScript app (active migration target)**
   - Entry: `src/main.tsx`, app routes in `src/App.tsx`, pages in `src/pages/*`.
   - Shared nav abstraction keeps legacy page names/routes compatible (`src/services/navigation/legacyNavigation.ts`, `src/context/NavigationContext.tsx`).

2. **Legacy static app (kept for parity/backward compatibility)**
   - Legacy shell and pages live under `public/legacy-index.html` + `public/legacy-pages/*`.
   - Older iframe/postMessage navigation model remains in `services/navigation/*` and `app.js`.

Migration goal is parity-first: preserve behavior, styling, mobile UX, and local/offline characteristics while moving page logic to React.


## 3) Feature parity snapshot (important migration status)

- `WelcomePage`, `PackSelect`, `PackManagement`, `PackEdit`, `SongManagement`: mostly high parity with legacy flows.
- `PdfReader`: core functionality works, but some legacy contextual UI/metadata display differs.
- `GameHistory`: currently simplified in React compared with legacy 75-cell history presentation.
- `SongView`: behavior differs from legacy in navigation semantics (return target/controls).
- `WelcomePage` currently has a TODO where legacy used to initialize game state before navigation.


## 4) Technical implementation details

### 4.1 Offline usage and caching

Build pipeline generates a Workbox service worker for production output:
- Build scripts: `npm run build` runs Vite build + `scripts/generate-sw-manifest.js` + `scripts/generate-workbox-sw.js`.
- Output SW: `dist/service-worker.js` (this is what production app registers from `src/main.tsx`).

Current runtime caching strategy (Workbox-generated):
- `assets-cache`: `CacheFirst` for `/assets/`.
- `pages-cache`: `NetworkFirst` for broad app/page requests.
- Workbox precache includes hashed build artifacts and generated SW manifest entries.

Important caveat:
- Repository still contains older/manual SW variants (`service-worker.js`, `src/sw-template.js`). Avoid letting these diverge from the generated production behavior.

### 4.2 Local persistence and backward compatibility

- IndexedDB (`src/storage/indexedDb.ts`) stores songs/packs and is designed to preserve legacy schema expectations.
- localStorage game state mirrors legacy helper model (`resources/state-helpers/gameStorage.js`) for continuity.
- Compatibility-sensitive changes must preserve:
  - DB name/object store names/keys and migration behavior.
  - localStorage key names and expected field shapes.

### 4.3 PDF reader implementation

- React PDF rendering uses `pdfjs-dist` via dynamic import in `src/components/PDFViewer.tsx`.
- Worker is loaded from bundled assets (`pdf.worker` chunk) for offline-capable modern path.
- Legacy PDF page still references CDN worker in `public/legacy-pages/pdf-reader/pdf-reader.js`; this can reduce offline reliability on legacy surface.

### 4.4 Mobile compatibility

Mobile behavior currently depends heavily on inherited legacy CSS contracts:
- Full-height shell and constrained content panes.
- Sticky bottom actions on editing screens.
- Tight positional layout in headers/nav.

Do not refactor structure or selector names casually during migration; layout parity is fragile and selector-driven.


## 5) Tech stack summary

- Framework/runtime: React 18, React Router 6, TypeScript.
- Build/dev server: Vite.
- Styling: Tailwind (PostCSS) + legacy global/per-page CSS.
- Offline/PWA: Service Worker (Workbox-generated in build), web app manifest.
- Data/storage: IndexedDB + localStorage.
- PDF rendering: `pdfjs-dist`.
- Drag reorder: `sortablejs`.
- Testing: Playwright E2E (`tests/offline-pdf.spec.ts` focuses on offline PDF/cache behavior).


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

Styling architecture is hybrid and parity-oriented:
- Base/utilities: `src/styles/tailwind.css`
- Legacy global look-and-feel: `styles.css`
- Legacy page CSS imported in `src/main.tsx` from `src/styles/legacy/*`

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
- Legacy and React defaults for some game-state fields may differ in edge cases.
- Some React pages are intentionally incomplete vs legacy (`GameHistory`, `SongView` semantics, parts of `PdfReader` UI context).
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


## 12) Migration checklist (incomplete work)

This lists items that still need work before legacy can be removed:

### 12.1 Feature parity gaps to close
- [ ] **GameHistory page**: implement 75-cell visual history grid matching legacy behavior.
- [ ] **SongView page**: align navigation behavior with legacy (Back → Song Management, remove Next/Prev controls if not legacy-intended).
- [ ] **PdfReader page**: add missing contextual UI (song title header, pack index/progress display).
- [ ] **WelcomePage**: resolve TODO and ensure game state initialization parity before Pack Select navigation.

### 12.2 Offline/cache cleanup
- [ ] **Retire manual SW files**: Remove or clearly document `service-worker.js` and `src/sw-template.js` to prevent drift from generated Workbox SW.
- [ ] **Legacy cache cleanup**: Add explicit cache migration/cleanup logic to purge old `pianobingo-cache-v1` or other legacy cache names when users upgrade.
- [ ] **Legacy PDF CDN worker**: Replace CDN worker URL in `public/legacy-pages/pdf-reader/pdf-reader.js` with bundled worker path, or explicitly document legacy offline limitations.

### 12.3 Testing coverage
- [ ] **Extend offline PDF test**: Add actual PDF render lifecycle validation (worker startup + first page render) to `tests/offline-pdf.spec.ts`.
- [ ] **Add mobile viewport E2E**: Validate key flows on mobile viewport sizes.
- [ ] **Add parity smoke tests**: Automated comparison of React vs legacy page behavior for regression detection.

### 12.4 Final migration tasks
- [ ] **Remove legacy surface**: Once all above complete, remove `public/legacy-pages/*`, `app.js`, `services/navigation/*`, and legacy nav/iframe logic.
- [ ] **Clean unused CSS**: Remove legacy CSS imports from `src/main.tsx` and consolidate into Tailwind where practical.


## 13) Confirmed project decisions

1. **Legacy files**: Kept only until migration complete, then removed.
2. **Deployment**: Root-only hosting (custom domain at domain root); no subpath GitHub Pages support needed.
3. **Service worker consolidation**: Manual SW files should be retired once migration validated.
4. **Design modernization**: Allow controlled improvements per page, but structure/core styling must remain close to original. Mobile behavior and offline characteristics are non-negotiable.
