// Le numéro de version change à chaque mise à jour du code pour forcer
// tous les navigateurs à télécharger la nouvelle version (network-first
// pour index.html), au lieu de servir une copie en cache obsolète.
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'majorbet-' + CACHE_VERSION;
const BASE = '/AUGUSTA';
const STATIC_ASSETS = [
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png'
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
  const url = e.request.url;

  // Firebase, ESPN, Google : toujours réseau, jamais de cache
  if (url.includes('firestore') ||
      url.includes('espn') ||
      url.includes('googleapis') ||
      url.includes('gstatic')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // index.html (et la racine) : NETWORK-FIRST.
  // On veut toujours la dernière version du code en priorité.
  // Le cache ne sert que de secours si le réseau est indisponible.
  if (url.endsWith('/AUGUSTA/') || url.endsWith('/AUGUSTA/index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Reste (manifest, icônes) : cache-first, ça change rarement
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
