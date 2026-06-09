const CACHE = 'pickmyai-v3';

// Only cache local files - never external domains
const STATIC = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/main.min.js',
  '/blog/',
  '/blog/index.html',
  '/offline.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't block install on cache fail
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept: API calls, external domains, chrome-extension, non-GET
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_vercel')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => {
        // Only show offline page for navigation requests
        if (e.request.mode === 'navigate') return caches.match('/offline.html');
      });
    })
  );
});