/* Projet Toji — fonctionne hors connexion.
   Stratégie : on répond tout de suite avec la copie locale, et on met à jour en arrière-plan.
   Après une mise à jour des fichiers, ouvre l'app deux fois pour voir la nouvelle version. */
const CACHE = 'projet-toji-v5';
const CORE = [
  './', './index.html', './css/app.css', './js/data.js', './js/body.js', './js/hero.js', './js/stats.js', './js/app.js',
  './img/kuro/idle.webp', './img/kuro/flex.webp', './img/kuro/win.webp', './img/kuro/guard.webp', './img/kuro/curl.webp', './img/kuro/power.webp', './img/kuro/eat.webp', './img/kuro/chill.webp',
  './manifest.webmanifest', './fonts/dela-gothic-one.woff2', './fonts/archivo-var.woff2',
  './icons/icon-192.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // IA et Open Food Facts : toujours en ligne
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || fresh;
    })
  );
});
