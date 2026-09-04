type NativeWindow = typeof window & {
  Capacitor?: { isNativePlatform?: () => boolean };
};

function isNativeCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as NativeWindow).Capacitor?.isNativePlatform?.());
}

export function registerPwaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isNativeCapacitorApp()) return;

  window.addEventListener("load", () => {
    if (isNativeCapacitorApp()) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch((error) => {
        console.warn("PWA service worker registration failed", error);
      });
  });
}
