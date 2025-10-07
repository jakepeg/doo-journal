const CACHE_NAME = 'doo-journal-v3';
const STATIC_CACHE = 'doo-journal-static-v3';
const DYNAMIC_CACHE = 'doo-journal-dynamic-v3';
const RUNTIME_CACHE = 'doo-journal-runtime-v3';

// Cache duration constants (in milliseconds)
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000,    // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,       // 24 hours
  API: 5 * 60 * 1000,                 // 5 minutes
  IMAGE: 30 * 24 * 60 * 60 * 1000,    // 30 days
};

// Assets to cache immediately - only cache essential files
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// IC-specific URL patterns
const IC_CANISTER_PATTERN = /\.ic0\.io|\.icp0\.io/;
const IC_API_PATTERN = /\/api\//;
const ASSET_PATTERN = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/;

// Install event - cache only essential static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v3...');
  event.waitUntil(
    Promise.all([
      // Cache only essential assets immediately
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Pre-caching essential assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/icons/' + '*'));
      }),
      // Skip waiting to activate immediately for faster updates
      self.skipWaiting()
    ]).catch((error) => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v3...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('v3')) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activated and controlling all clients');
    })
  );
});

// Helper function to check if response is fresh
function isResponseFresh(response, maxAge) {
  const cachedDate = response.headers.get('sw-cached-date');
  if (!cachedDate) return false;
  
  const age = Date.now() - parseInt(cachedDate);
  return age < maxAge;
}

// Helper function to add cache metadata
function addCacheMetadata(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('sw-cached-date', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Optimized fetch handler with proper caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-http/https requests and non-GET requests
  if (!request.url.startsWith('http') || request.method !== 'GET') {
    return;
  }
  
  const url = new URL(request.url);

  // Strategy 1: Network First for HTML (SPA navigation)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE, CACHE_DURATION.DYNAMIC));
    return;
  }

  // Strategy 2: Stale While Revalidate for API calls (IC canisters)
  if (IC_CANISTER_PATTERN.test(url.hostname) && IC_API_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE, CACHE_DURATION.API));
    return;
  }

  // Strategy 3: Cache First for static assets (long-lived)
  if (ASSET_PATTERN.test(url.pathname)) {
    const cacheTime = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/) 
      ? CACHE_DURATION.IMAGE 
      : CACHE_DURATION.STATIC;
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE, cacheTime));
    return;
  }

  // Strategy 4: Network First for everything else (IC assets, fonts, etc.)
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE, CACHE_DURATION.DYNAMIC));
});

// Network First Strategy: Try network, fallback to cache
async function networkFirstStrategy(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, addCacheMetadata(networkResponse.clone()));
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && isResponseFresh(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    // For navigation requests, return index.html for SPA routing
    if (request.mode === 'navigate') {
      const indexCache = await caches.match('/');
      if (indexCache) return indexCache;
    }
    
    throw error;
  }
}

// Cache First Strategy: Check cache first, then network
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  // Return fresh cached response
  if (cachedResponse && isResponseFresh(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Update cache with fresh response
      const cache = await caches.open(cacheName);
      cache.put(request, addCacheMetadata(networkResponse.clone()));
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      // Update cache in background
      caches.open(cacheName).then(cache => {
        cache.put(request, addCacheMetadata(response.clone()));
      });
    }
    return response;
  }).catch(() => {
    // Ignore fetch errors in background
    return null;
  });
  
  // Return cached response immediately if available and fresh
  if (cachedResponse && isResponseFresh(cachedResponse, maxAge)) {
    // Don't await the fetch, let it update cache in background
    fetchPromise;
    return cachedResponse;
  }
  
  // Wait for network if no fresh cache
  const networkResponse = await fetchPromise;
  return networkResponse || cachedResponse || new Response('Service Unavailable', { status: 503 });
}

// Periodic cache cleanup
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!cacheName.includes('v3')) continue;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedDate = response.headers.get('sw-cached-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate);
          const maxAge = cacheName.includes('static') ? CACHE_DURATION.STATIC : CACHE_DURATION.DYNAMIC;
          
          if (age > maxAge) {
            console.log('Service Worker: Removing expired cache entry', request.url);
            await cache.delete(request);
          }
        }
      }
    }
  }
}

// Handle background sync for cache cleanup and offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupExpiredCache());
  } else if (event.tag === 'journal-entry-sync') {
    event.waitUntil(syncJournalEntries());
  }
});

// Schedule periodic cache cleanup
setInterval(() => {
  if ('serviceWorker' in self && self.registration) {
    self.registration.sync.register('cache-cleanup');
  }
}, 60 * 60 * 1000); // Every hour

// Sync journal entries when back online
async function syncJournalEntries() {
  try {
    // Get pending entries from IndexedDB or localStorage
    const pendingEntries = await getPendingEntries();
    
    for (const entry of pendingEntries) {
      try {
        // Attempt to sync with backend
        await syncEntryWithBackend(entry);
        // Remove from pending list on success
        await removePendingEntry(entry.id);
      } catch (error) {
        console.error('Failed to sync entry:', entry.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline data management
async function getPendingEntries() {
  // Implementation would use IndexedDB or localStorage
  return [];
}

async function syncEntryWithBackend(entry) {
  // Implementation would make API call to backend
  return Promise.resolve();
}

async function removePendingEntry(entryId) {
  // Implementation would remove from local storage
  return Promise.resolve();
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/192x192.png',
    badge: '/icons/72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Journal',
        icon: '/icons/192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Doo Journal', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  // Handle weekly reminder notifications
  if (event.notification.tag === 'weekly-reminder') {
    if (event.action === 'open' || !event.action) {
      // Open the add-entry page
      event.waitUntil(
        clients.openWindow('/add-entry')
      );
    } else if (event.action === 'dismiss') {
      // Just close the notification (already handled above)
      console.log('User dismissed reminder');
    }
    return;
  }
  
  // Handle other notifications
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
