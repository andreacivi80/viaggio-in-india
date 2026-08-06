const CACHE = "india-insieme-v1.42.0";
const PRECACHE = [
  "./",
  "./manifest.webmanifest",
  "./icon.svg",
  "./sw-register.js",
  "./ui/sunrise.png",
  "./ui/sunset.png",
  /* BUILD_PRECACHE */
];
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Usa una chiave URL normalizzata: alcune WebView inviano Request con
  // opzioni di cache che rendono cache.match(Request) non riutilizzabile.
  const cacheKey = event.request.mode === "navigate"
    ? new URL("./", self.location.href).href
    : url.href;
  const cached = caches.open(CACHE).then((cache) => cache.match(cacheKey));
  const network = fetch(event.request).then(async (response) => {
    if (response.ok && url.origin === self.location.origin) {
      const cache = await caches.open(CACHE);
      await cache.put(cacheKey, response.clone());
    }
    return response;
  });
  // L'app shell deve aprirsi anche quando il telefono perde la rete durante
  // una navigazione. La nuova revisione viene comunque installata in una
  // cache versionata e sostituisce automaticamente quella precedente.
  event.respondWith(
    cached.then((hit) => hit || network).catch(() => caches.match("./")),
  );
  event.waitUntil(network.then(() => {}).catch(() => {}));
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || "Nuovo aggiornamento dal viaggio." };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "India Insieme", {
      body: data.body || "Nuovo aggiornamento dal viaggio.",
      icon: "./icon.svg",
      badge: "./icon.svg",
      tag: data.tag || "india-update",
      renotify: true,
      data: { url: data.url || "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(event.notification.data?.url || "/");
        return existing.focus();
      }
      return clients.openWindow(event.notification.data?.url || "/");
    }),
  );
});
