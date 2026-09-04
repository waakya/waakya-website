/*
 * The smallest service worker that makes Vaakya installable.
 *
 * It deliberately caches almost nothing. Offline sync is out of scope for v1
 * (CLAUDE.md §2), and a worker that served stale task lists would be worse
 * than no worker at all: the whole product is whether the state on screen is
 * true. It caches the app shell's static assets and lets everything else go to
 * the network.
 */
const CACHE = "vaakya-shell-v1";
const SHELL = [
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Only the static shell is ever served from cache. Task data is never
  // cached: a stale "ho gaya" is exactly the lie this product exists to stop.
  if (!SHELL.includes(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
