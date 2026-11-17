const CACHE_NAME = 'gurukrupa-shell-v2';
const SHELL_ASSETS = ['/offline.html', '/manifest.webmanifest', '/clinic-icon.svg', '/clinic-icon-192.png', '/clinic-icon-512.png'];

const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  if (isDev) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  if (isDev) {
    self.registration.unregister();
  }
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (isDev) return; // Do not intercept Vite dev server requests on localhost
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedOffline = await caches.match('/offline.html');
        return cachedOffline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // Only cache static icons & manifest, never JavaScript bundles
  const urlPath = new URL(request.url).pathname;
  const isStaticAsset = urlPath.endsWith('.svg') || urlPath.endsWith('.png') || urlPath.endsWith('.webmanifest');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
