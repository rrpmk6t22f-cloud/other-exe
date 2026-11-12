const prefix = 'other-exe:' + self.registration.scope + ':';
const shell = prefix + '__REVISION__';
const fonts = prefix + 'fonts';
const files = /*__FILES__*/ [];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(shell).then(cache => cache.addAll(files)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== shell && key !== fonts) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(caches.open(shell).then(cache => cache.match('./index.html')).then(response => response || fetch(request)));
    return;
  }
  if (files.some(file => new URL(file, self.registration.scope).href === url.href)) {
    event.respondWith(caches.open(shell).then(cache => cache.match(request)).then(response => response || fetch(request)));
    return;
  }
  if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(fonts);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') {
        const keys = await cache.keys();
        if (keys.length >= 18) await cache.delete(keys[0]);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
