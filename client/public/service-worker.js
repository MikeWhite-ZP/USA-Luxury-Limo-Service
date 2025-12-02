const CACHE_NAME = 'usa-luxury-limo-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.log('Service Worker: Cache failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't try to cache chrome-extension, moz-extension, or other unsupported schemes
  const url = event.request.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return;
  }

  // Skip caching for API requests and external resources
  if (url.includes('/api/') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return an empty response if fetch fails for external resources
        return new Response('', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'text/css' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses or opaque responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return cached version or offline fallback
          return caches.match(event.request).then((response) => {
            if (response) {
              return response;
            }
            
            // Return index.html for navigation requests
            const acceptHeader = event.request.headers.get('accept');
            if (acceptHeader && acceptHeader.includes('text/html')) {
              return caches.match('/');
            }
          });
        });
    })
  );
});
