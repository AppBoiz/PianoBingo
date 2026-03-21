---
applyTo: "src/init/**/*.ts,src/shared/services/**/*.ts,src/shared/storage/**/*.ts,tests/integration/**/*.ts,package.json,scripts/**/*.js"
---

# PianoBingo — Offline, Storage, and PWA Instructions

## Preload and bootstrap

- `initializePreloadedData()` must run before React mounts so `pdfMap`, base pack data, and base song data are ready before the app needs them.
- Do not move preload work behind page render or route transitions.
- Treat preload failures as first-class app failures; silent degradation here usually surfaces later as missing PDFs or empty IndexedDB state.

## IndexedDB seeding gotchas

- IndexedDB seeding is lazy. Loading the welcome page does not seed anything by itself.
- Seeding runs when `openDB()` is first reached by an actual data access path such as `loadAllPacks()`.
- `firstTimeOpeningDB` is module-scoped. If a test clears the database mid-session, a full page reload may be required before seeding logic runs again.
- Preserve DB names, object store names, and localStorage schema compatibility unless the change explicitly includes a migration.

## PDF loading model

- `Song.pdfUrl` is polymorphic: it can be a lookup key, raw base64, or another resolved form. Do not assume it is already raw PDF data.
- Always use the shared PDF services (`resolvePdfBase64()`, validation helpers, document service) instead of ad-hoc string checks or direct PDF.js calls.
- The only PDF viewing routes are `/game` and `/song-view/:songId`. There is no `/pdf-reader` route.

## Build and deployment contracts

- The build must copy `resources/` into `dist/resources` before generating the service worker.
- If `resources/` is missing from `dist/`, preload fetches fail, `pdfMap` stays empty, and lookup-key PDFs never resolve.
- Workbox precache data is build-time output. Validate offline behavior with a production build when changing service-worker, resource, or PDF-loading code.

## Integration test cautions

- Service worker activation can destroy the execution context while tests are polling. Treat transient `Execution context was destroyed` failures as a retry condition, not immediate proof of a broken feature.
- `page.waitForFunction()` does not await a returned Promise. For Promise-based browser checks, use `page.evaluate()` inside `expect(async () => { ... }).toPass(...)`.