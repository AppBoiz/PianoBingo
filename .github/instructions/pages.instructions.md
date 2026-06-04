---
applyTo: "src/pages/**/*.ts,src/pages/**/*.tsx"
---

# PianoBingo — Page Implementation Instructions

## Route-level page structure

- Every route-level page lives at `src/pages/{feature}/{PageName}/{PageName}.tsx` and the exported component name must end in `Page`.
- Page-owned helpers stay alongside the page. Only extract a hook into `src/pages/{feature}/hooks/` when that logic is reused by multiple components in the feature.
- Do not create a large page-owning hook that hides the entire screen's behavior.

## Naming and test contracts

- Page root `data-testid` values follow `{kebab-name}-page`.
- Page-specific header/footer organisms also include `Page` in the component name.
- Route constants come from `src/shared/constants/navigation.ts`; do not hardcode route strings in page code.

## Page context rules

- `GamePage` and `GameHistoryPage` are gameplay context.
- `SongManagementPage`, `SongViewPage`, `PackManagementPage`, and `PackEditPage` are management context.
- Never expose `Song.songId` to users. In gameplay, show pack position; in management screens, show only the title.
- `SongViewPage` is preview-only from management flows. It uses the `/song-view/:songId` route and must not behave like a gameplay screen.
- `PackEditPage` may display pack position in the drag handle, but data attributes and storage calls still use `songId`.

## Browser API boundary

- Pages and page hooks must not call raw browser/runtime APIs directly.
- If a page needs `fetch`, `localStorage`, `FileReader`, DOM queries, PDF.js calls, or service-worker interaction, route it through `src/shared/services/`.

## Preferred implementation style

- Prefer named local helper functions and direct, visible state transitions over abstraction for its own sake.
- Import shared domain types from `src/shared/types/`; do not redeclare `Song` or `Pack` locally.
- Keep mutations followed by a canonical reload when consistency is important; do not let page-local optimistic state drift from IndexedDB without a clear reason.