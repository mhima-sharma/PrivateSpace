/*
 * PrivateSpace service worker.
 *
 * Privacy-first caching for an invite-only app:
 *  - API / auth responses are NEVER cached (no private data at rest).
 *  - Navigations are network-first, falling back to an offline page.
 *  - Hashed static assets (/_next/static, icons) are cached-first.
 *
 * Bump CACHE to invalidate old caches on deploy.
 */
const CACHE = "privatespace-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/logo.svg", "/icon-192.png", "/manifest.webmanifest"];

// In development we stay in passthrough mode for static assets so that
// un-hashed dev chunks are never cached (keeps hot-reload working). The app
// still installs because a fetch handler + manifest are present.
const IS_DEV = new URL(self.location.href).searchParams.get("env") === "development";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API or auth traffic — always go to the network.
  if (url.pathname.startsWith("/api")) return;

  // App navigations: network-first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Static assets: cache-first, then populate the cache for next time.
  // Skipped entirely in dev so hot-reload chunks are always fresh.
  if (IS_DEV) return;

  const isCacheable =
    url.pathname.startsWith("/_next/static") ||
    /\.(?:css|js|woff2?|png|svg|ico|jpg|jpeg|webp|avif)$/.test(url.pathname);

  if (!isCacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
