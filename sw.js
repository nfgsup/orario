// Service Worker per PWA
const CACHE_NAME = 'orario-v4'; // Cambia versione per forzare update
const urlsToCache = [
  '/orario/',
  '/orario/index.html',
  '/orario/style.css',
  '/orario/script.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install - skipWaiting forza l'attivazione immediata
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - Network first, poi cache (così prende sempre l'ultimo)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva in cache la nuova versione
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, usa la cache
        return caches.match(event.request);
      })
  );
});

// Activate - pulisce vecchie cache e prende controllo subito
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Prende controllo immediato
    })
  );
});
