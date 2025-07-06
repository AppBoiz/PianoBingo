const CACHE_NAME = 'my-pwa-cache-v3.2.1';


const urlsToCache = [
    "/.gitignore",
    "/app.js",
    "/CNAME",
    "/index.html",
    "/manifest.json",
    "/README.md",
    "/service-worker.js",
    "/styles.css",
    "/icons/icon-192x192-old.png",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512-old.png",
    "/icons/icon-512x512.png",
    "/resources/afterLoad.js",
    "/pages/game-history/game-history.css",
    "/pages/game-history/game-history.html",
    "/pages/pack-select/pack-select.css",
    "/pages/pack-select/pack-select.html",
    "/pages/pdf-reader/pdf-reader.css",
    "/pages/pdf-reader/pdf-reader.html",
    "/pages/pdf-reader/pdf-reader.js",
    "/pages/welcome-page/welcome-page.css",
    "/pages/welcome-page/welcome-page.html",
    "/resources/base64/all_pdfs.js",
    "/resources/base64/introdutione-seconda.js",
    "/resources/base64/pack_tom.js",
    "/resources/images/logo.png",
    "/resources/images/piano.png",
    "/resources/pdf/introdutione-seconda.pdf",
    "/resources/state-helpers/gameStorage.js",
    "/services/navigation/host.js",
    "/services/navigation/navigation.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  ];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
