/* ══════════════════════════════════════════════
   کوڕی پاک — Service Worker v3
   کار دەکات لە: Chrome, Edge, Firefox, Safari iOS
   ══════════════════════════════════════════════ */

const CACHE_NAME = 'kuripak-v3';
const OFFLINE_URL = 'https://kuripakapp.blogspot.com/';

/* فایلەکانی کور کاشێ بکە */
const PRECACHE = [
  'https://kuripakapp.blogspot.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

/* ═══ نصبکردن ═══ */
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE).catch(function() {});
    })
  );
});

/* ═══ چالاکبوون ═══ */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ═══ فێچ: Network-First بۆ HTML، Cache-First بۆ دیکە ═══ */
self.addEventListener('fetch', function(e) {
  var req = e.request;

  /* تەنها GET */
  if (req.method !== 'GET') return;

  /* ڤیدیۆ و Firebase: بەستنێ */
  var url = req.url;
  if (url.indexOf('youtube') > -1 ||
      url.indexOf('vidmol') > -1 ||
      url.indexOf('firestore') > -1 ||
      url.indexOf('identitytoolkit') > -1) return;

  /* HTML: Network-First */
  if (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') > -1) {
    e.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  /* بقیەی فایلەکان: Cache-First */
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
        return res;
      }).catch(function() { return cached; });
    })
  );
});
