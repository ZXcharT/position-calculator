const CACHE_NAME = 'position-calc-v10-share-20261020';
const APP_SHELL_URLS = [
  './assets/share/share-core.js',
  './assets/share/share-core.css',
  './assets/share/tool-share.js',
  './assets/share/tool-share.css',
  './assets/share/calc-diagrams.js',
  './assets/share/calc-diagrams.css',
  './assets/share/calc-position.js',
  './assets/share/multi-market-engine.js',
  './assets/share/multi-market.js',
  './assets/share/multi-market.css',
    './',
    './index.html',
    './utilities.css',
    './layout.css',
    './accents.css',
    './page.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './assets/brand/onechart-favicon.svg',
    './assets/brand/onechart-lockup-horizontal-black.svg',
    './assets/brand/onechart-lockup-horizontal-white.svg',
    './assets/brand/onechart-og.png'
];

// Every required UI resource is local; installation is atomic and needs no CDN.
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL_URLS)));
});

// Preserve the existing cache-first behavior and normal waiting-worker lifecycle.
self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(cacheNames => Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
    )));
});
