const CACHE_NAME = 'mec-attendance-v1';
const urlsToCache = [
  'index.html',
  'scan.html',
  'scan-shift.html',
  'history.html',
  'register.html',
  'config.html',
  'logo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
