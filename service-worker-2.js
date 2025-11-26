const CACHE_NAME = 'dedra-pwa-v2.1.0';
const urlsToCache = [
  '/Appka/',
  '/Appka/index.html',
  '/Appka/manifest.json',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded'
];

// Instalacja Service Workera - cachowanie plików
self.addEventListener('install', event => {
  console.log('[SW] Instalacja v2.1.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cachowanie plików');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktywacja - czyszczenie starych cache'y
self.addEventListener('activate', event => {
  console.log('[SW] Aktywacja v2.1.0...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Usuwam stary cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - strategia: Network First, potem Cache
self.addEventListener('fetch', event => {
  // Ignoruj zapytania do Google Apps Script
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Klonuj odpowiedź i zapisz w cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Jak nie ma internetu, zwróć z cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Fallback do głównej strony
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/Appka/index.html');
            }
          });
      })
  );
});
