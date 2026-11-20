// Service Worker for CortexEdge — AI Mastery for Aerospace (standalone track)
// Provides offline support after first visit

// Cache names are origin-wide (shared with the portal and sibling tracks on
// cortexelearn.github.io), so this worker only ever manages caches that carry
// its own prefix.
const CACHE_PREFIX = 'cortexedge-ai-mastery-';
const CACHE_NAME = CACHE_PREFIX + 'v14';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './diagrams/AIM-L01-data-path.png',
  './diagrams/AIM-L01-lesson-loop.png',
  './diagrams/AIM-L01-ncr-draft-flow.png',
  './diagrams/AIM-L01-roadmap.png',
  './diagrams/AIM-L02-capability-layers.png',
  './diagrams/AIM-L02-temperature.png',
  './diagrams/AIM-L02-token-loop.png',
  './diagrams/AIM-L03-deploy-tree.png',
  './diagrams/AIM-L03-eligibility.png',
  './diagrams/AIM-L03-landscape.png',
  './diagrams/AIM-L12-done-looks-like.png',
  './diagrams/AIM-L12-three-domains.png',
  './diagrams/AIM-L12-value-readiness.png',
  './diagrams/AIM-L14-npv-waterfall.png',
  './diagrams/AIM-L14-objections.png',
  './diagrams/AIM-L14-one-page.png',
];

// CDN assets — cached on first use so the app works offline after initial load
const RUNTIME_CACHE_HOSTS = [
  'unpkg.com',
  'cdnjs.cloudflare.com',
];

const matchesHost = (hostname, host) => hostname === host || hostname.endsWith('.' + host);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip YouTube requests — always go to network, never cache
  if (matchesHost(url.hostname, 'youtube.com') || matchesHost(url.hostname, 'youtube-nocookie.com') ||
      matchesHost(url.hostname, 'ytimg.com') || matchesHost(url.hostname, 'googlevideo.com')) {
    return;
  }

  const isAppShell = url.origin === self.location.origin;
  const isCdnAsset = RUNTIME_CACHE_HOSTS.some((host) => matchesHost(url.hostname, host));
  if (!isAppShell && !isCdnAsset) return;

  // The HTML shell (navigations and index.html) uses NETWORK-FIRST so that a new
  // deploy is picked up on the next online launch even if the SW version wasn't
  // bumped. Falls back to cache when offline. Everything else (icons, manifest,
  // versioned CDN libraries) uses CACHE-FIRST since those are immutable per URL.
  const isHtmlShell =
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isHtmlShell) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request, { cacheName: CACHE_NAME }).then((cached) => cached || caches.match('./index.html', { cacheName: CACHE_NAME }))
        )
    );
    return;
  }

  // Static assets + CDN: cache-first
  event.respondWith(
    caches.match(request, { cacheName: CACHE_NAME }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
