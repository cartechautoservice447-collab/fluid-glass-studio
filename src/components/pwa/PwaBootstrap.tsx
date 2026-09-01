import { useEffect } from "react";
import { registerPwaServiceWorker } from "@/lib/pwa";

/** Registers the service worker once on the client. Renders nothing. */
export function PwaBootstrap() {
  useEffect(() => {
    registerPwaServiceWorker();
  }, []);
  return null;
}
