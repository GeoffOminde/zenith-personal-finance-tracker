const CACHE_NAME = 'zenith-pwa-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// On install, the service worker will pre-cache critical assets.
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// On activate, clean up any old caches to save space.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, use a cache-first strategy.
self.addEventListener('fetch', event => {
  // We only cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If we have a cached response, return it immediately.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If the resource is not in the cache, fetch it from the network.
      return fetch(event.request).then(networkResponse => {
        // A response must be valid and a 200 status to be cached.
        if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
        }

        // Clone the response because it's a one-time-use stream.
        // One copy is for the cache, the other is for the browser.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});