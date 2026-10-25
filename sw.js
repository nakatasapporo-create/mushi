const CACHE_NAME = 'insect-word-game-v1';
const CORE_ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'
];
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // 外部資源が一部失敗しても、PWA本体のインストールは続ける。
    await Promise.allSettled(EXTERNAL_ASSETS.map(async url => {
      const response = await fetch(url, { mode: 'no-cors' });
      await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('insect-word-game-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
