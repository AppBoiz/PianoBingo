# PianoBingo
Piano bingo native app

## Documentation

For comprehensive project context, architecture, migration status, and coding agent guidance, see [docs/agent/CODING_AGENT_CONTEXT.md](docs/agent/CODING_AGENT_CONTEXT.md).

## Navigation

This is a single page application, which uses iframes to dynamically render the content. To register the app content container, the `services/navigation/host.js` script is linked to the html file it is contained in. Content pages link the script `services/navigation/navigation.js` and can use the function loadPage() in combination with the makshift `PAGES` enum, which should be extended when a page is added.

Internally, it uses events to communicate between origins, telling the parent when to switch to a different page.

## PDF Compilation

To compile pdfs into a bundled .js file, there is a python util. This is a workaround for localhost to avoid cors issues.

## Running local http server

```npx http-server -c-1 -p 3000 -o```

This command stops the browser from caching the web pages, so code can be edited and tested in real-time.

## Testing Service Worker & Offline PDFs (local)

1. Build the app:

```bash
npm run build
```

2. Serve the `dist/` directory over HTTPS or HTTP on localhost (service workers require secure contexts except on localhost). Example using `serve`:

```bash
npx serve dist -p 3000
```

3. Open the app at `http://localhost:3000` and check DevTools > Application > Service Workers to confirm `service-worker.js` is registered.

4. After install, confirm Cache Storage contains `assets/*` entries (the Workbox-generated SW precaches the hashed pdf worker and pdf chunks).

5. Test offline: in DevTools, enable "Offline" in the Network tab and reload — PDF viewing should still work because the worker and chunks are cached.

If you want the SW to be regenerated with new precache contents, re-run `npm run build`.
