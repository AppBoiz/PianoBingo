const CACHE_NAME = 'pianobingo-cache-v1';

// Keep a small precache list for core shell assets (legacy entries kept where useful)
const urlsToCache = [
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  // On install, attempt to fetch generated sw-manifest.json (created at build time)
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      let extra = [];
      try {
        const resp = await fetch('/sw-manifest.json');
        if (resp && resp.ok) {
          extra = await resp.json();
        }
      } catch (e) {
        // ignore — manifest may not exist in dev
      }
      const toCache = urlsToCache.concat(Array.isArray(extra) ? extra : []);
      await cache.addAll(toCache);
    })()
  );
});

// Runtime caching strategy:
// - Cache-first for built assets under /assets/ (ensures pdf.worker.* and pdf chunks are stored on first fetch)
// - Cache-first for same-origin requests that were precached
// - Network fallback for everything else
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Serve and cache built assets placed under /assets/
  if (url.origin === location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(req).then(cached => cached || fetch(req).then(res => { try { cache.put(req, res.clone()); } catch(e){}; return res; }))
      )
    );
    return;
  }

  // Serve precached assets cache-first
  event.respondWith(
    caches.match(req).then(cachedResponse => cachedResponse || fetch(req))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName);
      })
    ))
  );
});
