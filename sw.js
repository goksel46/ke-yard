// Kelimelik Türkçe Yardımcısı - Service Worker
// Uygulama kabuğunu (HTML/CSS/JS/ikonlar) önbelleğe alır.
// Böylece telefon/PC'de internet olmasa bile uygulama açılabilir.
// The single allowed dictionary is packaged beside the application files.

// Bump this value when the app shell changes so Chrome fetches fresh files.
const CACHE_VERSION = "v8";
const CACHE_NAME = "kelime-yardimcisi-" + CACHE_VERSION;

// Service Worker'ın çalıştığı klasörün yolu.
// Örn: https://kullanici.github.io/kelimelik-yardimcisi/
const BASE = new URL(self.registration.scope).pathname;

// Uygulamanın temel dosyaları
const APP_SHELL = [
  "", // start_url
  "index.html",
  "style.css",
  "app.js",
  "dictionary.txt",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
].map(p => BASE + p);


// ---------------------------------------------------------
// INSTALL
// ---------------------------------------------------------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});


// ---------------------------------------------------------
// ACTIVATE
// ---------------------------------------------------------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => {
        return Promise.all(
          names
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});


// ---------------------------------------------------------
// FETCH
// ---------------------------------------------------------
self.addEventListener("fetch", event => {
  const req = event.request;

  // Sadece GET isteklerini ele al
  if (req.method !== "GET") {
    return;
  }

  const url = new URL(req.url);

  // İsteğin uygulama kabuğuna ait olup olmadığını kontrol et
  const isAppShell =
    url.origin === self.location.origin &&
    APP_SHELL.includes(url.pathname);

  if (isAppShell) {

    // -----------------------------------------------------
    // APP SHELL:
    // Önce cache.
    // Cache'de yoksa internetten getir ve cache'e ekle.
    // -----------------------------------------------------
    event.respondWith(
      caches.match(req)
        .then(cached => {
          if (cached) {
            return cached;
          }

          return fetch(req)
            .then(res => {
              const copy = res.clone();

              caches.open(CACHE_NAME)
                .then(cache => cache.put(req, copy));

              return res;
            })
            .catch(() => cached);
        })
    );

  } else {

    // -----------------------------------------------------
    // DİĞER İSTEKLER:
    // Önce internet, hata olursa cache.
    // dictionary.txt APP_SHELL içinde olduğundan yalnızca üstteki
    // sabit dosya listesi ve cache kuralı üzerinden sunulur.
    // -----------------------------------------------------
    event.respondWith(
      fetch(req)
        .then(res => {

          // Sadece başarılı cevapları cache'le
          if (res && res.ok) {
            const copy = res.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(req, copy));
          }

          return res;
        })
        .catch(() => {
          return caches.match(req);
        })
    );

  }
});
