# PianoBingo

PianoBingo is an offline-capable React + TypeScript web app for running song-draw bingo games from configurable song packs. It supports gameplay, pack management, song management, and embedded PDF viewing for each song.

## What The App Does

- Start a game from a selected song pack.
- Draw songs and navigate through game history.
- Manage song packs and their song order.
- Manage songs, including attached PDF content.
- Work offline through IndexedDB, localStorage, and a generated service worker.

## Tech Stack

- React 18
- TypeScript
- React Router 6
- Vite
- Tailwind CSS + legacy parity CSS
- IndexedDB + localStorage
- Workbox-generated service worker
- pdfjs-dist for PDF rendering
- Playwright for E2E/integration tests
- Jest for unit tests

## Project Structure

```text
src/
  App.tsx
  main.tsx
  init/
  pages/
    game/
    packs/
    songs/
    welcome/
  shared/
    components/
    constants/
    context/
    services/
    storage/
    types/
    utils/
  styles/

tests/
  e2e/
  integration/
  support/
  unit/

resources/
public/
scripts/
docs/
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Run The App Locally

```bash
npm run dev
```

This starts the Vite development server.

## Build And Preview

### Production Build

```bash
npm run build
```

The build does more than just Vite:

- builds the React app
- copies `resources/` into `dist/resources`
- generates a service worker manifest
- generates the final Workbox service worker

### Preview The Production Build

```bash
npm run preview
```

Use preview when you want to validate production-like behavior locally.

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Architecture-Focused Unit Tests

```bash
npm run test:arch
```

### End-To-End And Integration Tests

```bash
npm run test:e2e
```

### Playwright UI Mode

```bash
npm run test:e2e:ui
```

### Run Everything

```bash
npm run test:all
```

Notes:

- Playwright runs against a production build served locally.
- Offline and service worker behavior should be validated through the production build, not only through `npm run dev`.

## Deployment

PianoBingo is currently designed for static hosting.

### Recommended Deployment Flow

```bash
npm install
npm run build
```

Then publish the contents of `dist/` to your static host.

### Important Deployment Notes

- The app expects the production build output in `dist/`.
- `resources/` must be present inside `dist/resources` for PDF and preload data to work.
- The service worker is generated during the build and emitted as `dist/service-worker.js`.
- The app is safest to deploy at the site root. Several runtime paths assume root hosting, including `/service-worker.js`, `/manifest.json`, and some `/resources/...` fetches.
- If you deploy under a subpath instead of the domain root, audit routing, asset paths, resource loading, and service worker scope carefully.

## Important Technical Notes

- App bootstrap starts in `src/main.tsx` and preloads data before React mounts.
- IndexedDB seeding is lazy and happens on first real database access, not just on app load.
- PDF rendering is embedded in the game and song-view flows. There is no standalone `/pdf-reader` route.
- Styling is hybrid: Tailwind is used alongside legacy CSS that is still important for visual parity.
- `Song.songId` is a technical database identifier. User-facing numbering in gameplay is based on pack position, not the raw song ID.

## Documentation

- Detailed project guide: [docs/README.md](docs/README.md)
- Coding-agent project context: [docs/agent/CODING_AGENT_CONTEXT.md](docs/agent/CODING_AGENT_CONTEXT.md)

## Useful Commands

```bash
npm run dev
npm run build
npm run preview
npm run test:unit
npm run test:e2e
npm run test:all
```
