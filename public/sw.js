/*
 * Open Pickleball — minimal offline service worker.
 *
 * Strategy:
 *   - Precache the app shell on install.
 *   - Navigations: network-first, falling back to the cached shell when offline
 *     (so the installed PWA still opens with no connection).
 *   - Static assets (icons, manifest): cache-first.
 *
 * The app's actual data lives in localStorage, so the app is fully usable
 * offline once the shell is cached. Kept dependency-free on purpose.
 */
const CACHE = 'open-pickleball-v1';
const SHELL = ['/', '/play', '/players', '/leaderboard', '/help', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((res) => {
          if (res.ok && (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/_next/static/'))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
      );
    }),
  );
});
