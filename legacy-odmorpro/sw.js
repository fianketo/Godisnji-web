// Minimal service worker — its main job is satisfying the browser's PWA
// installability check (a registered fetch handler) so "Add to Home
// Screen" actually offers the install prompt instead of just a bookmark.
// Network-first: always prefers the live deployed version (this app
// changes often) and only falls back to the cached shell when there's no
// connection at all. Doesn't cache Firebase calls or the login video —
// those need to be live/fresh, not stale-cached.
const CACHE_NAME = 'odmorpro-shell-v2';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    // cache: 'no-store' — without this, "network-first" is only
    // aspirational: fetch() still honors normal HTTP caching, so a
    // browser can hand back a stale cached response instead of actually
    // hitting the network, and a deployed change silently never shows up.
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
