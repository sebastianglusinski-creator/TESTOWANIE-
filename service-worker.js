const CACHE_NAME = 'dedra-pwa-v5.0.0';
const IMAGE_CACHE = 'dedra-images-v1';
const API_CACHE = 'dedra-api-v1';

// Podstawowe pliki do cache'owania
const STATIC_ASSETS = [
  './', // Główna strona
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded'
];

// === INSTALACJA ===
self.addEventListener('install', event => {
  console.log('[SW] 🚀 Instalacja v5.0.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 📦 Cachowanie podstawowych plików');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] ✅ Instalacja zakończona');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] ❌ Błąd instalacji:', err))
  );
});

// === AKTYWACJA ===
self.addEventListener('activate', event => {
  console.log('[SW] 🔄 Aktywacja v5.0.0...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Usuń stare cache (oprócz aktualnych)
          if (cacheName !== CACHE_NAME && 
              cacheName !== IMAGE_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] 🗑️ Usuwam stary cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] ✅ Aktywacja zakończona');
      return self.clients.claim();
    })
  );
});

// === FETCH - SMART CACHING ===
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 1. OBRAZKI z photo.appdedra.pl i Firebase - CACHE FIRST ⚡
  if (url.hostname === 'photo.appdedra.pl' || 
      url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(cacheFirstImage(event.request));
    return;
  }
  
  // 2. API Google Apps Script - NETWORK FIRST (świeże dane)
  if (url.hostname === 'script.google.com') {
    event.respondWith(networkFirstAPI(event.request));
    return;
  }
  
  // 3. Fonty Google - CACHE FIRST
  if (url.hostname === 'fonts.googleapis.com' || 
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }
  
  // 4. Reszta - NETWORK FIRST
  event.respondWith(networkFirst(event.request));
});

// === STRATEGIA: Cache First (dla obrazków) ===
async function cacheFirstImage(request) {
  try {
    // 1. Sprawdź cache
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] 📸 Zdjęcie z cache:', request.url.split('/').pop());
      return cached;
    }
    
    // 2. Pobierz z sieci
    console.log('[SW] 🌐 Pobieram zdjęcie:', request.url.split('/').pop());
    const response = await fetch(request, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    // 3. Zapisz w cache (tylko 200 OK)
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('[SW] 💾 Zapisano w cache');
    }
    
    return response;
    
  } catch (error) {
    console.error('[SW] ❌ Błąd obrazka:', error);
    
    // Zwróć szary placeholder przy błędzie
    return new Response(
      '<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect fill="#f3f4f6" width="60" height="60"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' }}
    );
  }
}

// === STRATEGIA: Network First (dla API) ===
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    
    // Cache tylko udane odpowiedzi JSON
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    // Fallback do cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] 📡 API z cache (offline)');
      return cached;
    }
    throw error;
  }
}

// === STRATEGIA: Cache First (ogólna) ===
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// === STRATEGIA: Network First (ogólna) ===
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// === CZYSZCZENIE CACHE ===
self.addEventListener('message', event => {
  if (event.data.action === 'clearImageCache') {
    caches.delete(IMAGE_CACHE).then(() => {
      console.log('[SW] 🗑️ Cache obrazków wyczyszczony');
      event.ports[0].postMessage({ success: true });
    });
  }
});
