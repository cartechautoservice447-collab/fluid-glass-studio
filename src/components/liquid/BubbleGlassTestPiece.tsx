import { Droplets } from "lucide-react";
import { useMemo, useState } from "react";

import { LiquidSlider } from "@/components/liquid/LiquidSlider";
import { Switch } from "@/components/ui/switch";

const BUBBLE_CSS = `
@keyframes lg-bubble-rise {
  0%   { transform: translate3d(0, 12%, 0) scale(0.65); opacity: 0; }
  12%  { opacity: 0.9; }
  50%  { transform: translate3d(var(--drift, 6px), -45%, 0) scale(1); }
  85%  { opacity: 0.75; }
  100% { transform: translate3d(calc(var(--drift, 6px) * -1), -108%, 0) scale(0.85); opacity: 0; }
}
@keyframes lg-water-sway {
  0%, 100% { transform: translateX(-2%) skewY(-0.6deg); }
  50%      { transform: translateX(2%) skewY(0.6deg); }
}
.lg-bubble { animation: lg-bubble-rise var(--dur, 6s) linear infinite; will-change: transform, opacity; }
.lg-water  { animation: lg-water-sway 7s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .lg-bubble, .lg-water { animation: none; } }
`;

type Bubble = { id: number; left: number; size: number; dur: number; delay: number; drift: number };

const buildBubbles = (count: number): Bubble[] =>
  Array.from({ length: count }, (_, index) => {
    const seed = (index * 9301 + 49297) % 233280 / 233280;
    const seed2 = (index * 4177 + 12345) % 65536 / 65536;
    return {
      id: index,
      left: 6 + seed * 88,
      size: 5 + seed2 * 16,
      dur: 4.5 + seed2 * 5,
      delay: seed * 6,
      drift: (seed2 > 0.5 ? 1 : -1) * (4 + seed * 12),
    };
  });

export function BubbleGlassTestPiece() {
  const [enabled, setEnabled] = useState(true);
  const [fill, setFill] = useState(62);
  const [density, setDensity] = useState(14);
  const [tint, setTint] = useState(45);

  const bubbles = useMemo(() => buildBubbles(density), [density]);

  return (
    <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-4">
      <style>{BUBBLE_CSS}</style>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">
            <Droplets className="size-4" />Bubble Water Glass · Test Piece
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Experimental water-filled glass. Preview only — it does not affect any other panel in the app.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Toggle bubble water test piece" />
      </div>

      <div
        className="relative h-44 overflow-hidden rounded-[1.6rem] border border-white/25"
        style={{
          backdropFilter: "blur(calc(var(--liquid-blur-effective, var(--liquid-density, 12px)) + 2px)) saturate(160%)",
          background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -18px 40px rgba(0,0,0,0.28), 0 20px 40px -22px rgba(0,0,0,0.55)",
        }}
      >
        {enabled && (
          <>
            <div
              className="absolute inset-x-0 bottom-0 overflow-hidden"
              style={{ height: `${fill}%` }}
            >
              <div
                className="lg-water absolute inset-x-[-6%] -top-2 bottom-0 rounded-t-[45%]"
                style={{
                  background: `linear-gradient(180deg, rgba(56,189,248,${0.1 + tint / 260}), rgba(16,110,190,${0.18 + tint / 200}))`,
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.5)",
                }}
              />
              <div className="absolute inset-0">
                {bubbles.map((bubble) => (
                  <span
                    key={bubble.id}
                    className="lg-bubble absolute bottom-0 rounded-full"
                    style={{
                      left: `${bubble.left}%`,
                      width: `${bubble.size}px`,
                      height: `${bubble.size}px`,
                      animationDelay: `${bubble.delay}s`,
                      ["--dur" as string]: `${bubble.dur}s`,
                      ["--drift" as string]: `${bubble.drift}px`,
                      background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.28) 55%, rgba(255,255,255,0.06) 100%)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      backdropFilter: "blur(1px)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-gradient-to-tr from-transparent via-white/12 to-transparent" />
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
          <span>Liquid Sample</span>
          <span>{enabled ? `${fill}% filled` : "Empty"}</span>
        </div>
      </div>

      <div className="space-y-5">
        <LiquidSlider label="Water Fill" hint="How much of the test glass is filled with liquid." value={fill} min={0} max={100} display={`${fill}%`} onChange={setFill} />
        <LiquidSlider label="Bubble Density" hint="Number of rising bubbles inside the test glass." value={density} min={0} max={40} display={`${density}`} onChange={setDensity} />
        <LiquidSlider label="Water Tint" hint="Depth and saturation of the liquid inside the test glass." value={tint} min={0} max={100} display={`${tint}%`} onChange={setTint} />
      </div>
    </div>
  );
}
