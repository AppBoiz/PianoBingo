const CACHE_NAME = 'my-pwa-cache-v3';
let urlPrefix;
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    urlPrefix = ''
} else {
    urlPrefix = '/PianoBingo'
}
const urlsToCache = [
    urlPrefix + '/',
    urlPrefix + '/index.html',
    urlPrefix + '/styles.css',
    urlPrefix + '/app.js',
    urlPrefix + '/icons/icon-192x192.png',
    urlPrefix + '/icons/icon-512x512.png',
    urlPrefix + '/resources/base64/introdutione-seconda.js',
    urlPrefix + '/pages/pdf-reader.html',
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
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
