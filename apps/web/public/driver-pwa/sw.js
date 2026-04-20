// Service Worker for Driver PWA
const CACHE_NAME = 'if-driver-v1';
const urlsToCache = [
  '/driver-pwa/',
  '/driver-pwa/index.html',
  '/driver-pwa/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});
