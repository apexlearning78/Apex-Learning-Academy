const CACHE = "apex-v5";

// Works on both GitHub Pages (/Apex-Learning-Academy/) and localhost (/).
const BASE = new URL("./", self.registration.scope).pathname;
const CORE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "css/index.css",
  BASE + "css/style.css",
  BASE + "css/mobile.css",
  BASE + "css/enhancements.css",
  BASE + "css/site-pages.css",
  BASE + "css/final-fixes.css",
  BASE + "js/main.js",
  BASE + "js/enhancements.js",
  BASE + "js/auth-nav.js",
  BASE + "assets/images/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match(BASE + "pages/404.html").then((fallback) =>
            fallback || new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        })
      )
  );
});
