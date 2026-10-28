const CACHE_NAME = "pokeduel-pwa-v666";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./vendor/peerjs-1.5.5.min.js",
  "./assets/arena/classic_arena.jpg",
  "./assets/arena/carmonte_arena.jpg",
  "./assets/ui/banana_wheel.jpg",
  "./assets/ui/pokeduel_logo.webp",
  "./assets/ui/tutorial_goal_board.png",
  "./js/data/i18n.js",
  "./js/data/sprites.js",
  "./js/data/figures.js",
  "./js/data/bots.js",
  "./js/audio/audio.js",
  "./js/engine/board.js",
  "./js/engine/battle.js",
  "./js/network/p2p_matchmaker.js",
  "./js/ui/ui.js",
  "./js/engine/ai.js",
  "./js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
