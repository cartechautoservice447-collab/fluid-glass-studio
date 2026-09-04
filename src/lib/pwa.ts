export function registerPwaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.Capacitor?.isNativePlatform?.()) return;

  window.addEventListener("load", () => {
    if (window.Capacitor?.isNativePlatform?.()) return;
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
