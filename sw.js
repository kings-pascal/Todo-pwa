// ============================================
// SERVICE WORKER
// ============================================
// A service worker is a JS file that runs in the background
// separate from your main app. It intercepts network requests
// and can serve cached files when there's no internet.
// This is what makes a PWA work offline.

const CACHE_NAME = "todos-v1";

// these are all the files we want to cache for offline use
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json"
];

// INSTALL - runs once when service worker is first registered
// we open a cache and store all our app files in it
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// ACTIVATE - runs after install, cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// FETCH - intercepts every network request
// if the file is in cache, serve it from cache (works offline)
// if not in cache, fetch from network as normal
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
