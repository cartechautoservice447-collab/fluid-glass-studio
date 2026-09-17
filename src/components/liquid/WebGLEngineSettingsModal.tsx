import { RotateCcw, Settings2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { LiquidSlider } from "@/components/liquid/LiquidSlider";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCustomization } from "@/context/CustomizationContext";

type Props = { trigger?: "button" | "icon"; userId?: string };
const PERFORMANCE_EVENT = "glass-performance-changed";
const performanceKey = (userId?: string) => userId ? `liquid-glass-performance-mode:${userId}` : "liquid-glass-performance-mode";

export function WebGLEngineSettingsModal({ trigger = "button", userId }: Props) {
  const {
    liquid,
    webgl,
    setWebGL,
    reset,
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

  useEffect(() => {
    const mode = localStorage.getItem(performanceKey(userId)) === "ultra" ? "ultra" : "high";
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

  const setPerformanceMode = (mode: "high" | "ultra") => {
    setPerformance(mode);
    localStorage.setItem(performanceKey(userId), mode);
    document.documentElement.dataset["glassPerformance"] = mode;
    window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: { userId, mode } }));
  };

  const triggerContent = trigger === "icon" ? (
    <GlassPanel glassId="engine-settings-trigger" glassRadius={18} glassBezel={24} className="h-10 w-10 !p-0">
      <Button type="button" size="icon" variant="ghost" className="h-full w-full bg-transparent hover:bg-white/10" aria-label="Open engine customization">
        <Settings2 className="size-4" />
      </Button>
    </GlassPanel>
  ) : (
    <GlassPanel glassId="engine-settings-trigger" glassRadius={18} glassBezel={24} className="h-10 !p-0">
      <Button type="button" variant="ghost" className="h-full w-full bg-transparent px-4 hover:bg-white/10">
        <Settings2 className="mr-2 size-4" />Engine Customization
      </Button>
    </GlassPanel>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/20 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-white/10 px-6 pb-5 pt-6">
          <DialogTitle>WebGL Liquid Glass Engine</DialogTitle>
          <DialogDescription>These settings control the shared WebGL shader and its performance profile. The source engine remains a single shared system.</DialogDescription>
        </DialogHeader>

        <section className="space-y-6 px-6 py-5">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Profile</p>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={40} className="border-white/20 bg-white/10" />
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2"><Zap className="size-4" /><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Performance</p></div>
            <div className="grid grid-cols-2 gap-2">
              {(["high", "ultra"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setPerformanceMode(mode)} aria-pressed={performance === mode} className={`rounded-xl border p-3 text-left transition ${performance === mode ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground hover:bg-white/10"}`}>
                  <span className="block text-sm font-medium capitalize">{mode}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{mode === "high" ? "Balanced DPR and render target" : "Maximum DPR and render target"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Appearance</p><p className="mt-1 text-xs text-muted-foreground">{theme === "dark" ? "Night mode" : "Day mode"}</p></div><ThemeToggle /></div>

          <div className="space-y-5 border-t border-white/10 pt-5">
            <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Exact WebGL Optics</p><p className="mt-1 text-xs text-muted-foreground">These values map directly to the shader uniforms used by every registered glass surface.</p></div>
            <LiquidSlider label="Thickness / Dome" hint="Physical thickness used by Snell-law refraction." value={webgl.thickness} min={10} max={100} display={`${webgl.thickness}px`} onChange={(value) => setWebGL({ thickness: value })} />
            <LiquidSlider label="Bezel Curve" hint="Edge roll-off thickness of the liquid surface." value={webgl.bezel} min={8} max={120} display={`${webgl.bezel}px`} onChange={(value) => setWebGL({ bezel: value })} />
            <LiquidSlider label="Index of Refraction" hint="IOR used by Snell's law." value={webgl.ior} min={1} max={5} step={0.1} display={webgl.ior.toFixed(1)} onChange={(value) => setWebGL({ ior: value })} />
            <LiquidSlider label="Chromatic Dispersion" hint="RGB wavelength separation through the glass." value={webgl.dispersion} min={0} max={5} step={0.1} display={webgl.dispersion.toFixed(1)} onChange={(value) => setWebGL({ dispersion: value })} />
            <LiquidSlider label="Poisson Blur" hint="Background blur sampled through the refracted lens." value={webgl.blur} min={0} max={20} step={0.5} display={`${webgl.blur}px`} onChange={(value) => setWebGL({ blur: value })} />
            <LiquidSlider label="Specular" hint="Physical edge highlight intensity." value={webgl.specular} min={0} max={1} step={0.05} display={webgl.specular.toFixed(2)} onChange={(value) => setWebGL({ specular: value })} />
            <LiquidSlider label="Tint" hint="Final glass tint mixed into the refracted color." value={webgl.tint * 100} min={0} max={50} step={1} display={`${Math.round(webgl.tint * 100)}%`} onChange={(value) => setWebGL({ tint: value / 100 })} />
            <LiquidSlider label="Shadow" hint="Contact/drop-shadow intensity." value={webgl.shadow} min={0} max={1} step={0.05} display={webgl.shadow.toFixed(2)} onChange={(value) => setWebGL({ shadow: value })} />
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">UI Text Clarity</p>
            <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-black/10 p-1">
              {(["default", "smooth", "medium", "punchy"] as const).map((value) => <button key={value} type="button" onClick={() => setUITextClarity(value)} aria-pressed={uiTextClarity === value} className={`rounded-lg px-2 py-2 text-xs font-medium capitalize transition ${uiTextClarity === value ? "bg-white/20 text-white" : "text-muted-foreground hover:bg-white/10"}`}>{value}</button>)}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div><p className="text-sm font-medium text-foreground">Pure Black</p><p className="mt-1 text-xs text-muted-foreground">Keep the WebGL glass system while using the deep-black presentation.</p></div><Switch checked={pureBlack} onCheckedChange={setPureBlack} /></div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div><p className="text-sm font-medium text-foreground">Background Theme</p><p className="mt-1 text-xs text-muted-foreground">Control the normal app background independently from the WebGL engine.</p></div><Switch checked={backgroundThemeEnabled} onCheckedChange={setBackgroundThemeEnabled} /></div>
            {backgroundThemeEnabled && <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><LiquidSlider label="Background Opacity" hint="Normal application background opacity." value={backgroundOpacity} min={0} max={100} display={`${backgroundOpacity}%`} onChange={setBackgroundOpacity} /><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-foreground">Fully Dark Background</p><p className="mt-1 text-xs text-muted-foreground">Use the deep-dark app background.</p></div><Switch checked={fullDarkBackground} onCheckedChange={setFullDarkBackground} /></div></div>}
          </div>

          <Button variant="secondary" className="w-full" onClick={reset}><RotateCcw className="mr-2 size-4" />Reset WebGL Liquid Glass defaults</Button>
          <p className="text-center text-[11px] text-muted-foreground">UI spring motion remains available through the existing interaction settings and is separate from WebGL optical parameters.</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
