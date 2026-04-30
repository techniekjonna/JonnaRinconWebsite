const CACHE_NAME = 'jonna-rincon-v1.5.0';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/site.webmanifest'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: produce an offline fallback Response when nothing is cached
const offlineFallbackResponse = () =>
  new Response('', { status: 504, statusText: 'Offline and not cached' });

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests - skip POST/PUT/DELETE so they pass through
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-http(s) schemes (chrome-extension:, data:, blob:, etc.)
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls - they should always hit the network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) {
    return;
  }

  // For navigation requests (page loads/refreshes), always serve index.html
  // This is critical for SPA client-side routing to work
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => (await caches.match('/')) || offlineFallbackResponse())
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request.clone()).then((response) => {
          // Only cache successful, basic (same-origin) responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache))
            .catch(() => {});

          return response;
        }).catch(async () => {
          const fallback = await caches.match(request);
          return fallback || offlineFallbackResponse();
        });
      })
      .catch(() => offlineFallbackResponse())
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Implementation for syncing offline orders
  console.log('Syncing orders...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Jonna Rincon', options)
  );
});
