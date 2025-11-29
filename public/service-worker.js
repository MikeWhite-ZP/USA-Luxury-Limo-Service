// Service Worker for USA Luxury Limo

const CACHE_NAME = 'usa-luxury-limo-v1';

// Helper function to check if URL is cacheable
function isCacheableRequest(request) {
  const url = new URL(request.url);
  
  // Only cache http and https schemes
  if (!url.protocol.startsWith('http')) {
    return false;
  }
  
  // Don't cache chrome extension URLs
  if (url.protocol === 'chrome-extension:') {
    return false;
  }
  
  return true;
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache essential resources here
      return cache.addAll([
        '/',
        '/index.html',
        // Add other essential static assets
      ].filter(url => {
        try {
          return isCacheableRequest(new Request(url));
        } catch {
          return false;
        }
      }));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-cacheable requests
  if (!isCacheableRequest(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Only cache if the request is cacheable
          if (isCacheableRequest(event.request)) {
            cache.put(event.request, responseToCache).catch((err) => {
              console.warn('Failed to cache:', event.request.url, err);
            });
          }
        });

        return response;
      });
    }).catch((error) => {
      console.error('Fetch failed:', error);
      // Return a custom offline page or response here if needed
      throw error;
    })
  );
});
