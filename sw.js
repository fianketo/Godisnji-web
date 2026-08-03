// Minimal service worker — its main job is satisfying the browser's PWA
// installability check (a registered fetch handler) so "Add to Home
// Screen" actually offers the install prompt instead of just a bookmark.
// Network-first: always prefers the live deployed version and only falls
// back to the cached shell when there's no connection at all.
const CACHE_NAME = 'biotest-shell-v4';
const SHELL_ASSETS = [
  './',
  './index.html',
  './katalog.html',
  './lokacije.html',
  './teren.html',
  './popusti.html',
  './blog.html',
  './clanak.html',
  './o-nama.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/js/catalog.js',
  './assets/js/discount.js',
  './assets/js/blog.js',
  './assets/icons/icon.svg',
  './assets/img/hero-video-poster.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/vendor/leaflet/leaflet.css',
  './assets/vendor/leaflet/leaflet.js',
  './data/biotest-analize.json',
  './data/blog-posts.json',
  './data/test-descriptions.json',
  './data/locations.json'
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
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
