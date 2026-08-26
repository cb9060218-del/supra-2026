const CACHE_NAME = "supra-cache-v1";
const urlsToCache = [
  "/pending",
  "/login",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for document pages when offline
        if (event.request.mode === "navigate") {
          return caches.match("/pending");
        }
      });
    })
  );
});
