const CACHE_NAME = 'usa-luxury-limo-v3';
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

function shouldSkipRequest(url) {
  // Skip external storage URLs (MinIO, S3, Replit Object Storage, etc.)
  if (url.includes('minio.') || 
      url.includes('.s3.') || 
      url.includes('s3.amazonaws.com') ||
      url.includes('X-Amz-Signature') ||
      url.includes('X-Amz-Credential') ||
      url.includes('replit.dev') ||
      url.includes('object.storage') ||
      url.includes('objectstorage')) {
    return true;
  }
  
  // Skip CMS uploaded media files (pattern: cms-*-timestamp.extension)
  // Supports folder names with hyphens like hero-images, testimonials, etc.
  if (/cms-[a-zA-Z0-9_-]+-\d+\.(png|jpg|jpeg|gif|webp|ico|svg)/.test(url)) {
    return true;
  }
  
  // Skip any URL with presigned query parameters
  if (url.includes('?') && (url.includes('Signature') || url.includes('Expires') || url.includes('token'))) {
    return true;
  }
  
  return false;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't try to cache chrome-extension, moz-extension, or other unsupported schemes
  const url = event.request.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return;
  }

  // Skip handling for external storage URLs and CMS media - let browser handle directly
  if (shouldSkipRequest(url)) {
    return;
  }

  // Skip caching for API requests and external resources
  if (url.includes('/api/') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'text/css' }
        });
      })
    );
    return;
  }

  // Only handle same-origin requests for caching
  const requestUrl = new URL(url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  
  if (!isSameOrigin) {
    // For cross-origin requests, just fetch without caching
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
