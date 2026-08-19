import { useEffect, useState } from "react";

export function AppDownloadCenter() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  return (
    <div aria-label="App installation options" className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {!online && (
        <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl">
          Offline mode
        </div>
      )}
      {installEvent && (
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition hover:bg-white/15"
        >
          Install Liquid Glass Studio
        </button>
      )}
      <div className="flex gap-2">
        <a className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur-xl" href="/downloads/android/Liquid%20Glass%20Studio.apk">
          Android APK
        </a>
        <a className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur-xl" href="/downloads/windows/Liquid%20Glass%20Studio.msix">
          Windows App
        </a>
      </div>
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}
