// Service Worker for client-side caching
const CACHE_NAME = 'skillstride-v1';
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  IMAGES: 24 * 60 * 60 * 1000, // 1 day for images
  API: 5 * 60 * 1000, // 5 minutes for API responses
};

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/src/assets/course-detail-long.jpg',
  '/src/assets/course-marketing.jpg', 
  '/src/assets/course-web.jpg',
  '/src/assets/hero-lms.jpg',
  '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_DURATION.STATIC));
  } else if (isImage(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_DURATION.IMAGES));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_DURATION.API));
  } else {
    event.respondWith(networkFirstStrategy(request, CACHE_DURATION.STATIC));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, maxAge) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
      const isExpired = Date.now() - cachedTime.getTime() > maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
      const isExpired = Date.now() - cachedTime.getTime() > maxAge;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    return new Response('Network error', { status: 408 });
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.includes('/assets/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff');
}

function isImage(url) {
  return url.pathname.includes('/storage/') ||
         url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isAPIRequest(url) {
  return url.hostname.includes('supabase.co') && url.pathname.includes('/rest/');
}