const CACHE_NAME = 'majorbet-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Pour Firebase et ESPN : toujours réseau (pas de cache)
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('espn') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Pour le reste : cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
