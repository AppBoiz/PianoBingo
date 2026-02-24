/**
 * ⚠️ DEPRECATED: This Workbox template is NO LONGER USED.
 * 
 * The build process uses workbox-build.generateSW() (not injectManifest),
 * which generates a complete service worker without needing this template.
 * 
 * See scripts/generate-workbox-sw.js for the actual SW generation logic.
 * 
 * This file is kept only for reference and will be removed once the React
 * migration is complete.
 */

/* Workbox service worker template used by workbox-build.injectManifest.
   The injectManifest step will replace self.__WB_MANIFEST with the precache manifest.
*/
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Precache manifest injected by workbox-build
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  // Cache-first for built assets under /assets/
  workbox.routing.registerRoute(
    ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/assets/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'assets-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 200 }),
      ],
    })
  );

  // Network-first for navigation requests (HTML) to keep shell updated
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({ cacheName: 'pages-cache' })
  );

  // Stale-while-revalidate for CSS/JS from same origin
  workbox.routing.registerRoute(
    ({request, url}) => url.origin === self.location.origin && (request.destination === 'script' || request.destination === 'style'),
    new workbox.strategies.StaleWhileRevalidate({ cacheName: 'static-resources' })
  );
}
