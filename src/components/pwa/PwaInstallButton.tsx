import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let mounted = true;
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (mounted) setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      if (!mounted) return;
      setInstalled(true);
      setInstallEvent(null);
    };
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) setInstalled(true);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.error("PWA service worker registration failed", error);
      });
    }

    return () => {
      mounted = false;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (installed && !offline) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-xl">
      {offline ? (
        <span className="flex items-center gap-1.5" role="status" aria-live="polite">
          <WifiOff className="h-3.5 w-3.5" /> Offline mode
        </span>
      ) : installEvent ? (
        <button
          type="button"
          onClick={() => void install()}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" /> Install App
        </button>
      ) : null}
    </div>
  );
}
