# Migration README

React + TypeScript migration of PianoBingo from legacy static web app is **substantially complete**. All core workflows have React implementations with full parity to legacy behavior.

## Quick start (from project root)

```bash
npm install
npm run dev
npm run test:e2e      # Run Playwright test suite (12 passing, 1 skipped)
npm run build         # Production build with Workbox SW generation
npm run preview       # Preview production build locally
```

## Migration status (as of 2026-02-24)

### ✅ Completed (all 8 core pages ported)
- **WelcomePage**: Game initialization with state setup
- **PackSelect**: Pack selection and game start workflow
- **PackManagement**: Create/rename/delete packs
- **PackEdit**: Edit pack songs and order
- **SongManagement**: Create/rename/delete/preview songs, PDF attachment
- **GameHistory**: 75-box bingo grid with song highlighting
- **PdfReader**: Full game flow with hamburger menu, next/prev song, end game
- **SongView**: Song preview mode from management UI
- **Storage layer**: IndexedDB + localStorage with legacy compatibility
- **Tests**: 12 passing E2E tests covering core workflows and offline functionality

### 📋 Incomplete (cleanup phase)
- **Parity smoke tests**: Automated React vs legacy comparison tests not yet implemented
- **Legacy surface removal**: All legacy files (`public/legacy-pages/`, `app.js`, `services/navigation/`) still present
- **Service worker consolidation**: Manual SW files (`/service-worker.js`, `src/sw-template.js`) available for cleanup once migration fully validated
- **CSS cleanup**: Legacy CSS imports still active; Tailwind consolidation deferred to post-migration

## Key implementation details

See [CODING_AGENT_CONTEXT.md](CODING_AGENT_CONTEXT.md) for:
- Detailed architecture and tech stack
- Offline/caching strategy (Workbox)
- Storage compatibility approach
- Mobile + PWA handling
- Deployment constraints and guardrails

## Verification checklist for contributors

When adding or modifying migration work:
1. Ensure `npm run test:e2e` all tests pass
2. Verify `npm run build` completes with no errors
3. Test offline capability with `npm run preview` + DevTools offline mode
4. Check mobile layout on Firefox DevTools responsive design mode (375px × 667px)
5. Update CODING_AGENT_CONTEXT.md if architecture/patterns change

## Next steps

1. **Validate migration completeness** (current phase): All workflows ported and tested ✅
2. **Add parity smoke tests**: Optional automated regression suite comparing React vs legacy
3. **Remove legacy surface**: When ready for full migration, delete:
   - `public/legacy-pages/` directory
   - `app.js`, `services/navigation/`
   - Legacy iframe/postMessage navigation code
4. **Clean SW files**: Remove `/service-worker.js` and `src/sw-template.js`
5. **Consolidate CSS**: Remove `src/styles/legacy/` imports from `src/main.tsx`, migrate critical styling to Tailwind
