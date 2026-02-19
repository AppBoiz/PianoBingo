# Migration README

This repository has been scaffolded with a Vite + React + TypeScript app in-place to begin migrating the legacy app.

Quick start (from project root):

```bash
npm install
npm run dev
```

Notes:
- The original static files remain in the project; `public/` contains `manifest.json` and `CNAME`.
- I imported global `styles.css` to preserve the original look. We'll incrementally port page CSS to components and optionally adopt Tailwind classes.
- Next steps: port `resources/state-helpers/gameStorage.js` to `src/storage` (TypeScript), implement `PDFViewer` using `pdfjs-dist`, and create tests.
