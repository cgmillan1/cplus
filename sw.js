/* pwa-kit service worker. Generated: do not hand-edit the version; rerun pwa_kit.py instead. */
const VERSION = '18f7ad17b9';
const CACHE = 'shell-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;
/* C Plus edit: static files match their exact ?v= URL so a deploy is picked up at once. Keep when rerunning pwa_kit.py. */
const PRECACHE = [
  "./",
  "admin.html",
  "admin.js",
  "api.js",
  "config.js",
  "cplus-logo.svg",
  "icon-180.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-48.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "manifest.webmanifest",
  "offline.html",
  "pdf.js",
  "pwa.js",
  "receipt.js",
  "shared.js",
  "styles.css",
  "vendor/jspdf.umd.min.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== RUNTIME) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // never cache APIs (Supabase, Stripe, analytics)

  if (req.mode === 'navigate') {                       // pages: network first, cached copy, then offline page
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        (await caches.open(RUNTIME)).put(req, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('offline.html'));
      }
    })());
    return;
  }

  // static files: cache first, refresh in the background (stale-while-revalidate)
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async (res) => {
      if (res.ok && res.type === 'basic' && !req.headers.get('range')) (await caches.open(RUNTIME)).put(req, res.clone());
      return res;
    }).catch(async () => cached || (await caches.match(req, { ignoreSearch: true })));
    return cached || network;
  })());
});

/* ---------- Web Push (works on Android/desktop; on iPhone only after Add to Home Screen, iOS 16.4+) ---------- */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Update', {
    body: d.body || '', icon: d.icon || 'icons/icon-192.png', badge: 'icons/maskable-192.png',
    data: { url: d.url || './' }, tag: d.tag, renotify: !!d.tag,
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
      if (c.url === target && 'focus' in c) return c.focus();
    }
    return self.clients.openWindow(target);
  })());
});
