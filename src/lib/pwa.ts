type NativeWindow = typeof window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

function isNativeCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as NativeWindow).Capacitor?.isNativePlatform?.());
}

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function registerPwaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isNativeCapacitorApp()) return;

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
