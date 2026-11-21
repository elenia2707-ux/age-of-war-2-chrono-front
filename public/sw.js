/**
 * Self-cleaning Service Worker (v7).
 * Purges all legacy chrono-front-v1..v6 caches that caused stale sprite sheets on iOS Safari,
 * and intentionally does NOT intercept fetch requests so Vite's content-hashed bundles &
 * multi-page PNG sprite sheets load natively with zero WebKit SW interference.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
