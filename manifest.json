// === PDA DEDRA – SERVICE WORKER (opcja C – pełny) ===

const CACHE_STATIC = "dedra-static-v1";
const CACHE_API = "dedra-api-v1";
const CACHE_IMAGES = "dedra-images-v1";

const STATIC_FILES = [
  "/Appka/index.html",
  "/Appka/indexedDB.js",
  "/Appka/main.js",
  "/Appka/manifest.json",
  "/Appka/icon-192.png",
  "/Appka/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![CACHE_STATIC, CACHE_API, CACHE_IMAGES].includes(k))
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  if (url.includes("firebasestorage.googleapis.com")) {
    e.respondWith(cacheFirstImages(e.request));
    return;
  }

  if (url.includes("script.google.com")) {
    e.respondWith(staleWhileRevalidateAPI(e.request));
    return;
  }

  e.respondWith(networkWithFallback(e.request));
});

async function cacheFirstImages(req) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidateAPI(req) {
  const cache = await caches.open(CACHE_API);
  const cached = await cache.match(req);

  const networkPromise = fetch(req)
    .then(res => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

async function networkWithFallback(req) {
  try {
    return await fetch(req);
  } catch {
    return caches.match(req);
  }
}
