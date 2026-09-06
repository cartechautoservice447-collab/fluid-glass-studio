const CACHE_NAME = "liquid-glass-studio-v11";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/pwa-icon-exact-512-new.png",
  "/pwa-icon-exact-192-new.png",
  "/offline.html",
];

const NOTIFICATION_ICON = "/pwa-icon-exact-192-new.png";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // A single missing entry must not abort the whole install, or the
      // service worker never activates and offline support silently dies.
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic or auth callbacks (they carry one-time codes/tokens).
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname === "/reset-password") {
    return;
  }

  if (request.mode === "navigate") {
    const networkFirst = fetch(request)
      .then((response) => {
        if (response.ok && !url.search && !url.hash) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || (await caches.match("/")) || caches.match("/offline.html"));

    event.respondWith(networkFirst);
    return;
  }

  const destination = request.destination;
  if (["script", "style", "image", "font", "manifest"].includes(destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() ?? "" };
  }

  const title = data.title || "Liquid Glass Studio";
  const options = {
    body: data.body || "You have a Pomodoro update.",
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: data.tag || "liquid-glass-pomodoro",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const visibleClient = clients.find((client) => "focus" in client);
      if (visibleClient) return visibleClient.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
