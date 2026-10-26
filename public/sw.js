/* Clube da Meia-Noite PWA: somente shell offline e assets públicos estáticos. */
const VERSION = "midnight-pwa-v2";
const PRECACHE = `${VERSION}-precache`;
const STATIC_CACHE = `${VERSION}-static`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const scopedPath = (path) => `${SCOPE_PATH}/${path.replace(/^\/+/, "")}`;
const relativePath = (url) => url.pathname.startsWith(`${SCOPE_PATH}/`) ? url.pathname.slice(SCOPE_PATH.length) : url.pathname;
const OFFLINE_URL = scopedPath("offline.html");
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  scopedPath("manifest.webmanifest"),
  scopedPath("favicon.svg"),
  scopedPath("icons/icon-192.png"),
  scopedPath("icons/icon-512.png"),
  scopedPath("icons/icon-maskable-512.png"),
  scopedPath("icons/apple-touch-icon.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("midnight-pwa-") && ![PRECACHE, STATIC_CACHE].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

const isPrivatePath = (url) => {
  const path = relativePath(url);
  return path.startsWith("/api/") || path.startsWith("/auth/") || path.startsWith("/invite/") || path.startsWith("/reset-password");
};
const isStaticAsset = (request, url) => {
  const path = relativePath(url);
  if (path.startsWith("/_next/static/") || path.startsWith("/assets/") || path.startsWith("/icons/")) return true;
  return ["style", "script", "font", "image"].includes(request.destination) && /\.(?:css|js|mjs|woff2?|png|svg|webp|avif|ico)$/i.test(path);
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
