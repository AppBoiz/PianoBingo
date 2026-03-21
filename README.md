# PianoBingo

PianoBingo is a React + TypeScript web app for running song-draw games from configurable song packs, with local song/pack management and offline-capable PDF viewing.

## Project Structure (Final)

The source structure is page-centric and feature-grouped:

```text
src/
	App.tsx
	main.tsx
	pages/
		game/
			Game/
			GameHistory/
			PackSelect/
			hooks/
		packs/
			PackEdit/
			PackManagement/
			hooks/
		songs/
			SongManagement/
			SongView/
			hooks/
		welcome/
			WelcomePage/
	shared/
		components/
		constants/
		context/
		services/
		storage/
		types/
		utils/
	init/
	styles/
	vite-env.d.ts
```

Notes:
- Page files are kept with explicit names inside each page folder (for example `Game.tsx`, `PackEdit.tsx`, `SongView.tsx`).
- Reusable cross-feature code lives under `src/shared/*`.
- Route constants are in `src/shared/constants/navigation.ts`.

## Documentation

Detailed agent context and migration notes:
- `docs/agent/CODING_AGENT_CONTEXT.md`
- `docs/agent/README_MIGRATION.md`

## Development

```bash
npm install
npm run dev
```

## Build and Preview

```bash
npm run build
npm run preview
```

## Tests

```bash
# E2E + integration tests (Playwright)
npm run test:e2e

# E2E + integration tests with Playwright interactive UI
npm run test:e2e:ui

# Unit tests (Jest)
npm run test:unit

# All tests (unit + E2E + integration)
npm run test:all
```
