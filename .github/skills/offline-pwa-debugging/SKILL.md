---
name: offline-pwa-debugging
description: Debug preload, service-worker, offline caching, and PDF loading problems in PianoBingo. Use when PDFs fail to render, offline mode breaks, or preload/seeding behavior is unclear.
user-invocable: true
---

# Offline PWA Debugging

Use this skill when working on preload, service-worker, offline caching, resource-copy, or PDF-loading problems.

## Primary files

- `src/init/preloadData.ts`
- `src/shared/services/runtime/serviceWorkerService.ts`
- `src/shared/services/pdf/pdfSourceService.ts`
- `src/shared/services/pdf/pdfDocumentService.ts`
- `src/shared/storage/indexedDb.ts`
- `package.json`
- `scripts/generate-sw-manifest.js`
- `scripts/generate-workbox-sw.js`
- `tests/integration/**`

## Workflow

1. Confirm the route and symptom.
   - PDF viewing only happens on `/game` and `/song-view/:songId`.
   - There is no `/pdf-reader` route.

2. Trace the data path in order.
   - Build output contains `dist/resources`.
   - preload builds `pdfMap` and exposes preload globals.
   - app reaches the relevant storage access path.
   - `resolvePdfBase64()` resolves the song's `pdfUrl`.
   - PDF document service loads and renders the document.

3. Check for the most common breakpoints.
   - `resources/` missing from `dist/`
   - preload finished too late or failed silently
   - `pdfUrl` treated as raw base64 when it is a lookup key
   - lazy seeding never triggered because no IDB access happened
   - service worker not yet controlling the page during offline assertions

4. Validate with the right runtime.
   - Use a production build for service-worker and precache issues.
   - Use integration tests for preload, offline, and storage interactions.

## Important gotchas

- IndexedDB seeding is lazy; loading the welcome page alone does not seed.
- `page.waitForFunction()` does not await returned Promises in Playwright.
- Service-worker activation can destroy the execution context while a test is polling.
- `Song.pdfUrl` is polymorphic; always use shared PDF helpers.

## Expected output

When you use this skill, identify:
- the first broken link in the runtime chain
- whether the issue is build-time, preload-time, storage-time, or render-time
- the narrowest safe validation step after the fix