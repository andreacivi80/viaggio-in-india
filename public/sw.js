const CACHE = "india-insieme-v1.38.0";
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
  const network = fetch(event.request);
  event.waitUntil(
    network
      .then((response) => {
        if (!response.ok || url.origin !== self.location.origin) return;
        return caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      })
      .catch(() => {}),
  );
  event.respondWith(
    network.catch(() =>
      caches.match(event.request).then((hit) => hit || caches.match("./")),
    ),
  );
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
