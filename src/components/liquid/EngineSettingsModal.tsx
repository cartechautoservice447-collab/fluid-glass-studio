import { RotateCcw, Settings2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { LiquidSlider } from "@/components/liquid/LiquidSlider";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCustomization } from "@/context/CustomizationContext";
import {
  LIQUID_GLASS_DEFAULTS,
  readLiquidGlassSettings,
  resetLiquidGlassSettings,
  writeLiquidGlassSettings,
  type LiquidGlassWebGLSettings,
} from "@/lib/liquidGlassSettings";

type Props = { trigger?: "button" | "icon"; userId?: string };
const PERFORMANCE_EVENT = "glass-performance-changed";
const performanceKey = (userId?: string) => userId ? `liquid-glass-performance-mode:${userId}` : "liquid-glass-performance-mode";

const UI_TEXT_CLARITY_CSS = `
html[data-ui-text-clarity="smooth"] body { text-rendering: optimizeLegibility; }
html[data-ui-text-clarity="medium"] body { text-rendering: optimizeLegibility; }
html[data-ui-text-clarity="punchy"] body { text-rendering: optimizeLegibility; -webkit-font-smoothing: subpixel-antialiased; }
html[data-ui-text-clarity="smooth"] .text-white,
html[data-ui-text-clarity="smooth"] [class*="text-white/"] { text-shadow: 0 0 0.04px currentColor; }
html[data-ui-text-clarity="medium"] .text-white,
html[data-ui-text-clarity="medium"] [class*="text-white/"] { text-shadow: 0 0 0.12px currentColor; }
html[data-ui-text-clarity="punchy"] .text-white,
html[data-ui-text-clarity="punchy"] [class*="text-white/"] { color: #fff !important; text-shadow: 0 0 0.35px currentColor; }
html[data-ui-text-clarity="punchy"] .text-foreground { color: #fff !important; text-shadow: 0 0 0.35px currentColor; }
html[data-ui-text-clarity="punchy"] .text-muted-foreground { color: oklch(0.94 0.01 250) !important; text-shadow: 0 0 0.28px currentColor; }
`;

export function EngineSettingsModal({ trigger = "button", userId }: Props) {
  const {
    theme,
    displayName,
    setDisplayName,
    pureBlack,
    setPureBlack,
    backgroundThemeEnabled,
    setBackgroundThemeEnabled,
    backgroundOpacity,
    setBackgroundOpacity,
    fullDarkBackground,
    setFullDarkBackground,
    uiTextClarity,
    setUITextClarity,
  } = useCustomization();

  const [open, setOpen] = useState(false);
  const [performance, setPerformance] = useState<"high" | "ultra">("high");
  const [glass, setGlass] = useState<LiquidGlassWebGLSettings>(readLiquidGlassSettings);

  useEffect(() => {
    const key = performanceKey(userId);
    const mode = localStorage.getItem(key) === "ultra" ? "ultra" : "high";
    setPerformance(mode);
    document.documentElement.dataset["glassPerformance"] = mode;

    const onExternalChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; mode?: "high" | "ultra" }>).detail;
      if ((detail?.userId === userId || (!detail?.userId && !userId)) && detail?.mode) {
        setPerformance(detail.mode);
        document.documentElement.dataset["glassPerformance"] = detail.mode;
      }
    };

    window.addEventListener(PERFORMANCE_EVENT, onExternalChange);
    return () => window.removeEventListener(PERFORMANCE_EVENT, onExternalChange);
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    setGlass(readLiquidGlassSettings());
  }, [open]);

  const setPerformanceMode = (mode: "high" | "ultra") => {
    setPerformance(mode);
    localStorage.setItem(performanceKey(userId), mode);
    document.documentElement.dataset["glassPerformance"] = mode;
    window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: { userId, mode } }));
  };

  const updateGlass = <K extends keyof LiquidGlassWebGLSettings>(key: K, value: LiquidGlassWebGLSettings[K]) => {
    const next = writeLiquidGlassSettings({ [key]: value });
    setGlass(next);
  };

  const resetGlass = () => {
    const next = resetLiquidGlassSettings();
    setGlass(next);
  };

  return (
    <>
      <style>{UI_TEXT_CLARITY_CSS}</style>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger === "icon" ? (
            <Button type="button" size="icon" variant="ghost" className="shrink-0 border border-white/25 bg-transparent" aria-label="Open engine customization">
              <Settings2 className="size-4" />
            </Button>
          ) : (
            <Button variant="ghost" className="border border-white/25 bg-transparent">
              <Settings2 className="mr-2 size-4" />Engine Customization
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-h-[88vh] max-w-2xl border-0 bg-transparent p-0 shadow-none">
          <GlassPanel
            glassId="engine-settings-dialog"
            className="max-h-[88vh] overflow-y-auto p-6"
            glassRadius={32}
            glassBezel={48}
          >
            <DialogHeader>
              <DialogTitle className="tracking-tight">WebGL Liquid Glass</DialogTitle>
              <DialogDescription>
                Exact rendering controls for the shared WebGL Liquid Glass engine. Changes are live and remembered on this device.
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-6 pt-5">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-transparent p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Profile</p>
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={40} className="border-white/20 bg-transparent" />
                <p className="text-xs text-muted-foreground">Shown in the welcome greeting on your course grid.</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-transparent p-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">UI Text Clarity</p>
                  <p className="mt-1 text-xs text-muted-foreground">Normal interface text only. WebGL optics are unaffected.</p>
                </div>
                <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-transparent p-1">
                  {( ["default", "smooth", "medium", "punchy"] as const ).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUITextClarity(value)}
                      aria-pressed={uiTextClarity === value}
                      className={`rounded-lg px-2 py-2 text-xs font-medium transition ${uiTextClarity === value ? "bg-white/15 text-white shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}
                    >
                      {value[0].toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-transparent p-4">
                <div className="flex items-center gap-2"><Zap className="size-4" /><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Performance Mode</p></div>
                <p className="text-xs text-muted-foreground">Uses the same High/Ultra DPR and render-target profiles as the source WebGL engine.</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["high", "ultra"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setPerformanceMode(mode)} aria-pressed={performance === mode} className={`rounded-xl border p-3 text-left transition ${performance === mode ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-transparent text-muted-foreground hover:bg-white/10"}`}>
                      <span className="block text-sm font-medium">{mode === "high" ? "High" : "Ultra"}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{mode === "high" ? "Balanced visual effects" : "Maximum visual effects"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-transparent p-4">
                <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Appearance</p><p className="mt-1 text-xs text-muted-foreground">{theme === "dark" ? "Night mode" : "Day mode"} — the WebGL scene adapts automatically.</p></div>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-transparent p-4">
                <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Pure Black</p><p className="mt-1 text-xs text-muted-foreground">Controls the application background mode behind the glass.</p></div>
                <Switch checked={pureBlack} onCheckedChange={setPureBlack} aria-label="Toggle pure black background" />
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-transparent p-4">
                <div className="flex items-center justify-between gap-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Background Theme</p><p className="mt-1 text-xs text-muted-foreground">Independent controls for the scene behind the glass UI.</p></div><Switch checked={backgroundThemeEnabled} onCheckedChange={setBackgroundThemeEnabled} aria-label="Enable background theme controls" /></div>
                {backgroundThemeEnabled && <div className="space-y-5 border-t border-white/10 pt-4"><LiquidSlider label="Background Opacity" hint="Controls the non-glass background layer." value={backgroundOpacity} min={0} max={100} display={`${backgroundOpacity}%`} onChange={setBackgroundOpacity} /><div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-transparent p-3"><div><p className="text-sm font-medium text-foreground">Fully Dark Theme</p><p className="mt-1 text-xs text-muted-foreground">Use a uniform deep-dark scene behind the WebGL glass.</p></div><Switch checked={fullDarkBackground} onCheckedChange={setFullDarkBackground} aria-label="Toggle fully dark background" /></div></div>}
              </div>

              <div className="flex items-center gap-3"><h3 className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-foreground">WebGL Liquid Glass Physics</h3><span className="h-px flex-1 bg-gradient-to-r from-white/40 to-transparent" /></div>

              <LiquidSlider label="Thickness" hint="Refraction thickness used by the exact shader." value={glass.thickness} min={1} max={120} display={`${glass.thickness}px`} onChange={(value) => updateGlass("thickness", value)} />
              <LiquidSlider label="Bezel" hint="Default edge depth for WebGL glass surfaces." value={glass.bezel} min={4} max={100} display={`${glass.bezel}px`} onChange={(value) => updateGlass("bezel", value)} />
              <LiquidSlider label="IOR" hint="Index of refraction used by Snell's law." value={glass.ior} min={1} max={4} step={0.05} display={glass.ior.toFixed(2)} onChange={(value) => updateGlass("ior", value)} />
              <LiquidSlider label="Blur" hint="Poisson-disk background blur radius." value={glass.blur} min={0} max={8} step={0.1} display={glass.blur.toFixed(1)} onChange={(value) => updateGlass("blur", value)} />
              <LiquidSlider label="Specular" hint="Edge highlight intensity." value={glass.specular} min={0} max={1} step={0.01} display={glass.specular.toFixed(2)} onChange={(value) => updateGlass("specular", value)} />
              <LiquidSlider label="Tint" hint="Shader white-tint contribution." value={glass.tint} min={0} max={0.35} step={0.01} display={glass.tint.toFixed(2)} onChange={(value) => updateGlass("tint", value)} />
              <LiquidSlider label="Shadow" hint="Glass and modal shadow contribution." value={glass.shadow} min={0} max={1} step={0.01} display={glass.shadow.toFixed(2)} onChange={(value) => updateGlass("shadow", value)} />
              <LiquidSlider label="Chromatic Dispersion" hint="Red/green/blue separation at curved glass edges." value={glass.dispersion} min={0} max={4} step={0.05} display={glass.dispersion.toFixed(2)} onChange={(value) => updateGlass("dispersion", value)} />

              <Button variant="secondary" className="w-full" onClick={() => { resetGlass(); setGlass(LIQUID_GLASS_DEFAULTS); }}>
                <RotateCcw className="mr-2 size-4" />Reset WebGL Liquid Glass defaults
              </Button>
            </section>
          </GlassPanel>
        </DialogContent>
      </Dialog>
    </>
  );
}
