/* Clube da Meia-Noite PWA: somente shell offline e assets públicos estáticos. */
const VERSION = "midnight-pwa-v1";
const PRECACHE = `${VERSION}-precache`;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("midnight-pwa-") && ![PRECACHE, STATIC_CACHE].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

const isPrivatePath = (url) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/invite/") || url.pathname.startsWith("/reset-password");
const isStaticAsset = (request, url) => {
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) return true;
  return ["style", "script", "font", "image"].includes(request.destination) && /\.(?:css|js|mjs|woff2?|png|svg|webp|avif|ico)$/i.test(url.pathname);
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivatePath(url) || request.headers.has("authorization") || request.headers.has("apikey")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  if (!isStaticAsset(request, url) && !PRECACHE_ASSETS.includes(url.pathname)) return;

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === "basic") void caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_RUNTIME") event.waitUntil(caches.delete(STATIC_CACHE));
});
