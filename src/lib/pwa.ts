type NativeWindow = typeof window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

function isNativeCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as NativeWindow).Capacitor?.isNativePlatform?.());
}

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function isPwaProductionContext(): boolean {
  if (typeof window === "undefined") return false;
  return !(
    import.meta.env.DEV ||
    window.location.hostname === "localhost" ||
    window.location.hostname.endsWith(".lovableproject.com") ||
    window.location.hostname.includes("-preview--")
  );
}

export function registerPwaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isNativeCapacitorApp()) return;

  // The production worker must never control Vite's development preview. A
  // worker left behind by an earlier registration can otherwise serve stale
  // HTML that points at an obsolete optimized dependency graph.
  if (!isPwaProductionContext()) {
    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );
    if ("caches" in window) {
      void caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("liquid-glass-studio-")).map((key) => caches.delete(key))),
      );
    }
    return;
  }

  const start = () => {
    if (isNativeCapacitorApp()) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const checkForUpdate = () => {
          registration.update().catch(() => undefined);
        };

        checkForUpdate();

        // Keep the installed app fresh: re-check when the user returns to the
        // tab and on a slow interval, so a new deploy is picked up without a
        // manual hard refresh.
        const onVisible = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
      })
      .catch((error) => {
        console.warn("PWA service worker registration failed", error);
      });
  };

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
