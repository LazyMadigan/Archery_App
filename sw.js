// Offline cache: app shell + target library. Bump CACHE when files change.
const CACHE = 'wa3d-v33';
const SHELL = ['./', './index.html', './src/app.css', './src/app.js', './src/scoring.js', './src/games.js', './src/icons.js', './src/faces.js', './src/target.js', './targets/targets.json', './targets/courses.json', './manifest.webmanifest', './icon.png', './tools/trace.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // photos: cache-first, lazily; shell: network-first with cache fallback so updates arrive
  if (url.pathname.includes('/targets/photos/')) {
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })));
  } else {
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  }
});
