// Kelimelik Türkçe Yardımcısı - Service Worker
// Uygulama kabuğunu (HTML/CSS/JS/ikonlar) önbelleğe alır, telefon/PC'de
// internet olmadan da açılabilmesini sağlar. Sözlük dosyası internetten
// geldiği için ayrıca önbelleklenmez; yoksa sayfadaki .txt yükleme
// alanı zaten yedek olarak kullanılabiliyor.

const CACHE_VERSION = "v1";
const CACHE_NAME = "kelime-yardimcisi-" + CACHE_VERSION;

// self.registration.scope, bu dosyanın hangi klasörden servis edildiğini
// (örn. http://localhost/kelime_yardimcisi/) verir; yollar buna göre kurulur.
const BASE = new URL(self.registration.scope).pathname;
const APP_SHELL = [
  "", // start_url (index.html'e yönlenir)
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
].map(p => BASE + p);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  const isAppShell = url.origin === self.location.origin && APP_SHELL.includes(url.pathname);

  if(isAppShell){
    // Uygulama kabuğu: önce önbellek, yoksa ağdan al ve önbelleğe ekle.
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached))
    );
  } else {
    // Diğer istekler (örn. sözlük): önce ağ, olmazsa önbellek.
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
