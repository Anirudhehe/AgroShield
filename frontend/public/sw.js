/* Service Worker - cache locales and manifest for offline language support */
const CACHE_NAME = "agro-shield-v2";
const CACHE_URLS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/logo192.png",
  "/locales-manifest.json",
  "/locales/en/translation.json",
  "/locales/hi/translation.json",
  "/locales/kn/translation.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// runtime caching for disease descriptions and locale files
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/locales/") ||
    url.pathname === "/locales-manifest.json" ||
    url.pathname.startsWith("/locales/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((res) => {
            // update cache in background
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, res.clone()));
            return res.clone();
          })
          .catch(() => null);
        return cached || networkFetch;
      })
    );
  }
});
