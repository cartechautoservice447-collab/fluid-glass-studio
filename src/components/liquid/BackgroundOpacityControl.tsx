import { useEffect, useState } from "react";

const STORAGE_KEY = "liquid-glass-background-opacity";
const DEFAULT_OPACITY = 100;

function readOpacity() {
  const value = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : DEFAULT_OPACITY;
}

export function BackgroundOpacityControl() {
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);

  useEffect(() => {
    const value = readOpacity();
    setOpacity(value);
    document.documentElement.style.setProperty("--background-opacity", String(value / 100));
  }, []);

  const updateOpacity = (value: number) => {
    const next = Math.min(100, Math.max(0, value));
    setOpacity(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    document.documentElement.style.setProperty("--background-opacity", String(next / 100));
    window.dispatchEvent(new CustomEvent("background-opacity-change", { detail: next }));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Background Opacity</p>
          <p className="mt-1 text-xs text-muted-foreground">Adjust the background transparency without changing glass panels.</p>
        </div>
        <span className="min-w-12 rounded-lg bg-white/[0.06] px-2 py-1 text-center text-xs font-semibold tabular-nums text-foreground">{opacity}%</span>
      </div>
      <input
        aria-label="Background opacity"
        type="range"
        min="0"
        max="100"
        step="1"
        value={opacity}
        onChange={(event) => updateOpacity(Number(event.target.value))}
        className="mt-4 w-full accent-current"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>0%</span><span>100%</span></div>
    </div>
  );
}
