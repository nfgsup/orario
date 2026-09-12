// ===================================================================
// Service Worker — Orario 3Ai · 26/27
// Strategia: app-shell precaching + runtime cache (stale-while-revalidate)
// Le route /api/notes usano network-first con fallback al cache.
// ===================================================================

const VERSION = "v3ai-2627-v1";
const APP_SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
];

// --- INSTALL: precache app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

// --- ACTIVATE: cleanup old caches ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// --- FETCH: routing ---
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Navigation requests → network-first, fallback to cached "/" (SPA)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(APP_SHELL);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(APP_SHELL);
          return (await cache.match("/")) || (await cache.match(req));
        }
      })(),
    );
    return;
  }

  // API requests → network-first, fallback cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(RUNTIME);
          return (await cache.match(req)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets → stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((fresh) => {
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});

// --- MESSAGE: skipWaiting on demand ---
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// --- PERIODIC SYNC (best effort, may not be supported) ---
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-notes") {
    event.waitUntil(refreshNotes());
  }
});

async function refreshNotes() {
  try {
    const cache = await caches.open(RUNTIME);
    const res = await fetch("/api/notes", { cache: "no-store" });
    await cache.put("/api/notes", res.clone());
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: "notes-refreshed" }));
  } catch {
    /* ignore */
  }
}
