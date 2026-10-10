const CACHE_NAME = 'look-again-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through API calls to Express backend
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first for dynamic assets, cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
