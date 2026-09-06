import { useEffect } from "react";
import { registerPwaServiceWorker } from "@/lib/pwa";

/**
 * Registers the service worker after hydration (browser-only, no UI).
 */
export function PwaBootstrap() {
  useEffect(() => {
    registerPwaServiceWorker();
  }, []);

  return null;
}

export default PwaBootstrap;
