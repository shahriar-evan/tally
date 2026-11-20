// Tally service worker — minimal app-shell + runtime cache
const CACHE = "tally-v2";
const SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);

    // Never cache API calls — always go to network
    if (url.pathname.startsWith("/api/")) return;

    // For navigations: network-first, fallback to cached index
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(() => caches.match("/"))
        );
        return;
    }

    // For static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) =>
            cached ||
            fetch(request)
                .then((resp) => {
                    if (resp && resp.status === 200 && resp.type === "basic") {
                        const copy = resp.clone();
                        caches.open(CACHE).then((c) => c.put(request, copy));
                    }
                    return resp;
                })
                .catch(() => cached)
        )
    );
});
