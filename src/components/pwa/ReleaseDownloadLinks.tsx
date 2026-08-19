export function ReleaseDownloadLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <a href="https://github.com/cartechautoservice447-collab/fluid-glass-studio/releases/latest/download/Liquid%20Glass%20Studio.apk" className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur-xl">
        Download Android APK
      </a>
      <a href="https://github.com/cartechautoservice447-collab/fluid-glass-studio/releases/latest/download/Liquid%20Glass%20Studio.msix" className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur-xl">
        Download Windows App
      </a>
    </div>
  );
}
