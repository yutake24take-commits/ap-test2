/* シンプルなオフライン対応サービスワーカー */
const CACHE = "ap-tutor-v1";
const CORE = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./pwa-192x192.png",
  "./pwa-512x512.png",
  "./pwa-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Anthropic API は絶対にキャッシュしない（常にネットワーク）
  if (req.url.includes("api.anthropic.com")) return;
  if (req.method !== "GET") return;

  // キャッシュ優先、無ければ取得してキャッシュ（CDNのReact/Tailwindもオフライン化）
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
