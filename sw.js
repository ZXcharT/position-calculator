const CACHE_NAME = 'position-calc-v8';
const APP_SHELL_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './assets/brand/onechart-favicon.svg',
    './assets/brand/onechart-lockup-horizontal-black.svg',
    './assets/brand/onechart-lockup-horizontal-white.svg',
    './assets/brand/onechart-og.png'
];
const OPTIONAL_EXTERNAL_URLS = [
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap'
];

// 先保证本地 app shell 可离线安装；外部样式与字体缓存失败不阻断安装。
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL_URLS)
                .then(() => Promise.all(
                    OPTIONAL_EXTERNAL_URLS.map(url => cache.add(url).catch(() => null))
                )))
    );
});

// 拦截请求，优先使用缓存
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// 更新 Service Worker 时清理旧缓存
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
