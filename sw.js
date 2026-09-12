// Service Worker — Orario 3Ai · 26/27 (static vanilla version)
// App-shell precaching + stale-while-revalidate runtime.
const VERSION = "v3ai-2627-v1";
const APP_SHELL = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";

const PRECACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(APP_SHELL).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const c = await caches.open(APP_SHELL);
          c.put("./index.html", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const c = await caches.open(APP_SHELL);
          return (await c.match("./index.html")) || (await c.match(req));
        }
      })()
    );
    return;
  }

  e.respondWith(
    (async () => {
      const c = await caches.open(RUNTIME);
      const cached = await c.match(req);
      const network = fetch(req)
        .then((fresh) => { c.put(req, fresh.clone()).catch(() => {}); return fresh; })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
