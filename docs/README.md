# PianoBingo Developer Guide

This document covers the project in more detail than the root README. Use it when you need to understand how the app is structured, how data flows through the system, and what technical constraints matter during development and deployment.

## Overview

PianoBingo is an offline-capable progressive web app for running song-draw bingo games. The application supports four main areas:

- gameplay
- pack administration
- song administration
- PDF viewing for songs

At a high level, the app loads pre-bundled pack/song data, stores user-managed state locally in the browser, and renders song PDFs inside the app.

## Core User Flows

### Gameplay

Typical user flow:

1. Welcome page
2. Pack select
3. Start game
4. Draw and navigate songs in the game view
5. Open game history
6. End the game

### Song And Pack Management

The app also supports local administration workflows:

- create, rename, and delete songs
- attach and remove song PDFs
- create, rename, and delete packs
- edit pack contents and ordering

## Architecture

### Entry Points

- `src/main.tsx`: bootstraps preload, storage initialization, React render, and service worker registration
- `src/App.tsx`: route wiring

### Route-Level Pages

- `src/pages/welcome/WelcomePage/WelcomePage.tsx`
- `src/pages/game/PackSelectPage/PackSelectPage.tsx`
- `src/pages/game/GamePage/GamePage.tsx`
- `src/pages/game/GameHistoryPage/GameHistoryPage.tsx`
- `src/pages/packs/PackManagementPage/PackManagementPage.tsx`
- `src/pages/packs/PackEditPage/PackEditPage.tsx`
- `src/pages/songs/SongManagementPage/SongManagementPage.tsx`
- `src/pages/songs/SongViewPage/SongViewPage.tsx`

### Source Layout

```text
src/
  init/                 preload and bootstrap helpers
  pages/                route-level feature code
  shared/components/    reusable UI
  shared/constants/     navigation and other constants
  shared/context/       React context providers
  shared/services/      browser/runtime API wrappers
  shared/storage/       IndexedDB and persistence logic
  shared/types/         shared domain types
  shared/utils/         reusable helpers
  styles/               Tailwind and legacy CSS
```

## Boot Process And Data Loading

Application startup has an important constraint: preload must happen before React mounts.

### What Happens During Bootstrap

`src/main.tsx` does the following in order:

1. Calls `initializePreloadedData()`.
2. Triggers local storage game-state migration via `loadGameState()`.
3. Mounts the React app.
4. Registers the production service worker.

This matters because some later flows depend on preloaded base song data, base pack data, and the PDF lookup map already being available.

## Persistence Model

### IndexedDB

IndexedDB is the main structured data store for songs and packs.

Important behavior:

- seeding is lazy
- initial seed does not happen just by visiting the welcome page
- seed logic runs on first real database access path

This is important in both testing and debugging. If a test clears the database mid-session, a reload may be needed before expected seed behavior returns.

### localStorage

localStorage is used for game-state continuity and compatibility with earlier behavior. Changes here should be made cautiously because storage shape drift can break existing local state.

## Song Identity Rules

There are two different song identifiers in the app, and they must not be mixed up.

### Technical Song ID

- field: `Song.songId`
- purpose: database key and internal references
- should not be shown to users as a label

### Pack Position

- purpose: user-facing numbering inside a specific pack
- shown in gameplay and some pack editing contexts
- derived from the song's position in `Pack.songs[]`

This distinction is especially important in game history, the game header, and pack editing.

## PDF Pipeline

PDF rendering is built into the app rather than handled by a separate standalone page.

Important rules:

- PDF display happens in the game route and the song-view route
- there is no standalone `/pdf-reader` route
- `pdfjs-dist` is used through shared services
- songs may store either raw PDF base64 or lookup keys that resolve through the preloaded PDF map

### Relevant Pieces

- `src/shared/services/pdf/pdfSourceService.ts`
- `src/shared/services/pdf/pdfDocumentService.ts`
- `src/pages/game/hooks/usePdfSong.ts`

## Offline And PWA Behavior

The app is offline-capable, but the production build pipeline is part of that contract.

### Build-Time Offline Flow

`npm run build` performs these steps:

1. builds the app with Vite
2. copies `resources/` into `dist/resources`
3. generates a service-worker manifest
4. generates the final Workbox service worker

### Why `resources/` Matters

The `resources/` directory contains data needed at runtime, including PDF-related assets. Vite does not automatically copy this folder, so the explicit copy step is required.

If `dist/resources` is missing, preload and PDF resolution will fail.

### Service Worker Notes

- production output registers `dist/service-worker.js`
- caching is generated through Workbox during the build
- offline behavior should be tested against a production build, not only the dev server

## Styling Strategy

The React app styling is page-owned and parity-oriented.

### Current Setup

- `src/styles/legacy/*.css`: page-level parity styles imported by the matching route page component
- `styles.css`: retained only for the legacy HTML shell under `public/legacy-index.html`

This project carries legacy CSS intentionally to preserve layout and visual parity. Prefer page-scoped CSS ownership, and do not reintroduce app-wide style imports unless there is a clear cross-page requirement.

## Service Layer Boundary

Browser and runtime APIs are intentionally wrapped in shared service modules.

Examples include:

- DOM access
- localStorage
- service worker registration
- fetch/resource loading
- file reading
- PDF loading and rendering

Practical rule: components and hooks should not reach directly for browser APIs when a shared service already exists for that concern.

## Testing Strategy

### Unit Tests

- framework: Jest
- location: `tests/unit/`

### End-To-End And Integration Tests

- framework: Playwright
- locations: `tests/e2e/`, `tests/integration/`
- configured to run against a built app served locally

Useful commands:

```bash
npm run test:unit
npm run test:arch
npm run test:e2e
npm run test:e2e:ui
npm run test:all
```

## Deployment Guide

### Recommended Approach

Deploy the built `dist/` directory to a static host.

Typical flow:

```bash
npm install
npm run build
npm run preview
```

Then publish `dist/`.

### Hosting Constraint

The app is most reliable when hosted at the root of a domain. Some runtime paths currently assume root hosting, including the service worker and some resource fetch paths.

If you want to deploy under a subpath, treat that as a deliberate deployment project rather than a configuration toggle. Audit at least:

- router behavior
- service worker scope
- manifest and icon paths
- resource loading paths
- offline cache behavior

## Files Worth Knowing Early

- `package.json`: commands and dependencies
- `src/main.tsx`: bootstrap and service worker registration
- `src/App.tsx`: route map
- `src/init/preloadData.ts`: preload behavior
- `src/shared/storage/indexedDb.ts`: IndexedDB behavior
- `src/shared/services/`: browser/runtime boundaries
- `playwright.config.ts`: browser test setup
- `jest.config.cjs`: unit test setup

## Related Documentation

- Root project overview: [../README.md](../README.md)
- E2E testing and locator guide: [E2E_TESTING.md](E2E_TESTING.md)
- Agent-oriented implementation context: [agent/CODING_AGENT_CONTEXT.md](agent/CODING_AGENT_CONTEXT.md)