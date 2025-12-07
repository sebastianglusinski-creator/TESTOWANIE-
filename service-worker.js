
// ================================
//  DEDRA PWA - SERVICE WORKER v5
//  Wersja B – stabilny cache zdjęć
// ================================

const STATIC_CACHE = 'dedra-static-v5';
const IMAGE_CACHE  = 'dedra-images-v1';

// Pliki statyczne aplikacji (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/zadania.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install error:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(cachedResponse => {

          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse) {
                try {
                  cache.put(request, networkResponse.clone());
                } catch (e) {}
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }
});
