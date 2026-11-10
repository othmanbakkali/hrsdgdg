const CACHE_NAME = 'oria-admin-pwa-v4';

const PRECACHE_URLS = [
  '/admin/manifest.webmanifest',
  '/admin/favicon.svg',
  '/admin/icons/pwa-192x192.png',
  '/admin/icons/pwa-512x512.png',
  '/admin/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(err => console.warn('[Admin SW] Pre-cache warning:', err)))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[Admin SW] Purging obsolete cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass API requests from Service Worker caching in Admin
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network First for EVERYTHING in Admin so code is ALWAYS 100% fresh
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
