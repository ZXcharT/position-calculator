const CACHE_NAME = 'position-calc-v9';
const APP_SHELL_URLS = [
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
