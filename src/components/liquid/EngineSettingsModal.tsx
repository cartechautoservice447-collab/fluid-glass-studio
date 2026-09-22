import { Check, Settings2, RotateCcw, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { LiquidSlider } from "@/components/liquid/LiquidSlider";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCustomization } from "@/context/CustomizationContext";
import { WORKSPACE_TEMPLATES } from "@/lib/workspaceTemplates";

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
html[data-ui-text-clarity="punchy"] .on-stage { color: #fff !important; text-shadow: 0 0 0.35px currentColor; }
html[data-ui-text-clarity="punchy"] .on-stage-muted { color: oklch(0.96 0.01 250) !important; text-shadow: 0 0 0.3px currentColor; }
html[data-ui-text-clarity="punchy"] .notes-pulse-glow { text-shadow: 0 0 0.3px currentColor; }
`;

export function EngineSettingsModal({ trigger = "button", userId }: Props) {
  const { liquid, setLiquid, reset, theme, displayName, setDisplayName, pureBlack, setPureBlack, backgroundThemeEnabled, setBackgroundThemeEnabled, backgroundOpacity, setBackgroundOpacity, fullDarkBackground, setFullDarkBackground, uiTextClarity, setUITextClarity, workspaceTemplate, setWorkspaceTemplate } = useCustomization();
  const [open, setOpen] = useState(false);
  // Stored preference is read in the effect below: reading it here would run
  // during server rendering (no localStorage) and break SSR for this page.
  const [performance, setPerformance] = useState<"high" | "ultra">("high");

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

  const setPerformanceMode = (mode: "high" | "ultra") => {
    setPerformance(mode);
    localStorage.setItem(performanceKey(userId), mode);
    document.documentElement.dataset["glassPerformance"] = mode;
    window.dispatchEvent(new CustomEvent(PERFORMANCE_EVENT, { detail: { userId, mode } }));
  };

  return <>
    <style>{UI_TEXT_CLARITY_CSS}</style>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger === "icon" ? <Button type="button" size="icon" variant="outline" className="shrink-0 border-white/30 bg-white/10 backdrop-blur-xl hover:bg-white/20" aria-label="Open engine customization"><Settings2 className="size-4" /></Button> : <Button variant="outline" className="border-white/30 bg-white/10 backdrop-blur-xl hover:bg-white/20"><Settings2 className="mr-2 size-4" />Engine Customization</Button>}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/25 bg-white/10 backdrop-blur-2xl sm:max-w-lg" style={{ backdropFilter: "blur(calc(var(--liquid-density) + 8px)) saturate(170%)" }}>
        <DialogHeader><DialogTitle className="tracking-tight">Engine Customization</DialogTitle><DialogDescription>Tune the Apple Liquid Glass Engine. Every change is live and remembered.</DialogDescription></DialogHeader>
        <section className="space-y-6 pt-2">
          <div className="space-y-2 rounded-2xl border border-white/20 bg-white/5 p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Profile</p><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={40} className="border-white/20 bg-white/10" /><p className="text-xs text-muted-foreground">Shown in the welcome greeting on your course grid.</p></div>
          <div className="space-y-3 rounded-2xl border border-white/20 bg-white/5 p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">UI Text Clarity</p><p className="mt-1 text-xs text-muted-foreground">Controls clarity and color strength of normal interface text only. Glass physics and appearance are unchanged.</p></div><div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-black/10 p-1"><button type="button" onClick={() => setUITextClarity("default")} aria-pressed={uiTextClarity === "default"} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${uiTextClarity === "default" ? "bg-white/20 text-white shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Default</button><button type="button" onClick={() => setUITextClarity("smooth")} aria-pressed={uiTextClarity === "smooth"} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${uiTextClarity === "smooth" ? "bg-white/20 text-white shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Smooth</button><button type="button" onClick={() => setUITextClarity("medium")} aria-pressed={uiTextClarity === "medium"} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${uiTextClarity === "medium" ? "bg-white/20 text-white shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Medium</button><button type="button" onClick={() => setUITextClarity("punchy")} aria-pressed={uiTextClarity === "punchy"} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${uiTextClarity === "punchy" ? "bg-white/20 text-white shadow-sm" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"}`}>Punchy</button></div></div>
          <div className="space-y-3 rounded-2xl border border-white/20 bg-white/5 p-4"><div className="flex items-center gap-2"><Zap className="size-4"/><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Performance Mode</p></div><p className="text-xs text-muted-foreground">Choose the visual-performance profile used across the Glass interface.</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setPerformanceMode("high")} aria-pressed={performance === "high"} className={`rounded-xl border p-3 text-left transition ${performance === "high" ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground hover:bg-white/10"}`}><span className="block text-sm font-medium">High</span><span className="mt-1 block text-[11px] text-muted-foreground">Balanced visual effects</span></button><button type="button" onClick={() => setPerformanceMode("ultra")} aria-pressed={performance === "ultra"} className={`rounded-xl border p-3 text-left transition ${performance === "ultra" ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground hover:bg-white/10"}`}><span className="block text-sm font-medium">Ultra</span><span className="mt-1 block text-[11px] text-muted-foreground">Maximum visual effects</span></button></div></div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/5 p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Appearance</p><p className="mt-1 text-xs text-muted-foreground">{theme === "dark" ? "Night mode — obsidian liquid" : "Day mode — bright liquid"}</p></div><ThemeToggle /></div>
          <div className="space-y-3 rounded-2xl border border-white/20 bg-white/5 p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Workspace Templates</p><p className="mt-1 text-xs text-muted-foreground">Choose an optional workspace appearance. Original Glass keeps the current look unchanged.</p></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{WORKSPACE_TEMPLATES.map((template) => <button key={template.id} type="button" className="workspace-template-option" data-selected={workspaceTemplate === template.id ? "true" : "false"} aria-pressed={workspaceTemplate === template.id} onClick={() => setWorkspaceTemplate(template.id)}><div className={`workspace-template-preview workspace-template-preview--${template.id === "original-glass" ? "original" : template.id === "graphite-notes" ? "graphite" : template.id === "frosted-aurora" ? "frosted" : "midnight"}`}><div className="workspace-template-preview__stage"><div className="workspace-template-preview__columns"><div className="workspace-template-preview__column"><span className="workspace-template-preview__line workspace-template-preview__line--bright" /></div><div className={`workspace-template-preview__column workspace-template-preview__column--${template.id === "graphite-notes" ? "green" : template.id === "frosted-aurora" ? "cyan" : template.id === "midnight-oled" ? "blue" : ""}`}><span className="workspace-template-preview__line" /><span className="workspace-template-preview__line" /><span className="workspace-template-preview__line" /></div><div className="workspace-template-preview__column"><span className="workspace-template-preview__line workspace-template-preview__line--bright" /><span className="workspace-template-preview__line" /></div></div></div></div><div className="workspace-template-option__meta"><div><p className="workspace-template-option__name">{template.name}</p><p className="workspace-template-option__description">{template.description}</p></div><span className="workspace-template-check" aria-hidden><Check className="size-3" /></span></div></button>)}</div></div><div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/5 p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Pure Black</p><p className="mt-1 text-xs text-muted-foreground">Flat black background instead of the gradient glow. Glass panels stay as they are.</p></div><Switch checked={pureBlack} onCheckedChange={setPureBlack} aria-label="Toggle pure black background" /></div>
          <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">Background Theme</p><p className="mt-1 text-xs text-muted-foreground">Independent background controls. Glass panels and Glass physics are unchanged.</p></div><Switch checked={backgroundThemeEnabled} onCheckedChange={setBackgroundThemeEnabled} aria-label="Enable background theme controls" /></div>{backgroundThemeEnabled&&<div className="space-y-5 border-t border-white/10 pt-4"><LiquidSlider label="Background Opacity" hint="Controls only the background layer behind the Glass UI." value={backgroundOpacity} min={0} max={100} display={`${backgroundOpacity}%`} onChange={setBackgroundOpacity} /><div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3"><div><p className="text-sm font-medium text-foreground">Fully Dark Theme</p><p className="mt-1 text-xs text-muted-foreground">Use a uniform deep-dark background so the existing Glass sits cleanly on top.</p></div><Switch checked={fullDarkBackground} onCheckedChange={setFullDarkBackground} aria-label="Toggle fully dark background" /></div></div>}</div>
          <div className="flex items-center gap-3"><h3 className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-foreground">Liquid Glass Physics</h3><span className="h-px flex-1 bg-gradient-to-r from-white/40 to-transparent" /></div>
          <LiquidSlider label="Liquid Density" hint="Viscosity & refraction — backdrop blur radius of every glass surface." value={liquid.density} min={0} max={40} display={`${liquid.density}px`} onChange={(density) => setLiquid({ density })} />
          <LiquidSlider label="Liquid Transparency" hint="Alpha blending — how much of the world behind shows through the panel." value={liquid.transparency} min={5} max={95} display={`${liquid.transparency}%`} onChange={(transparency) => setLiquid({ transparency })} />
          <LiquidSlider label="Liquid Clearness" hint="Distortion & glare clarity — SVG turbulence index on refracted edges." value={liquid.clearness} min={0} max={100} display={`${liquid.clearness} idx`} onChange={(clearness) => setLiquid({ clearness })} />
          <LiquidSlider label="Liquid Gel" hint="Surface tension curves, 3D inner bevel and drop shadow depth." value={liquid.gel} min={0} max={100} display={`${liquid.gel}%`} onChange={(gel) => setLiquid({ gel })} />
          <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-4"><LiquidSlider label="Liquid Bounce · Stiffness" hint="Spring stiffness driving the gel bounce on hover, click and drag." value={liquid.bounceStiffness} min={100} max={500} step={5} display={`${liquid.bounceStiffness}`} onChange={(bounceStiffness) => setLiquid({ bounceStiffness })} /><LiquidSlider label="Liquid Bounce · Damping" hint="Lower damping = wobblier liquid; higher damping settles instantly." value={liquid.bounceDamping} min={10} max={40} display={`${liquid.bounceDamping}`} onChange={(bounceDamping) => setLiquid({ bounceDamping })} /></div>
          <Button variant="secondary" className="w-full" onClick={reset}><RotateCcw className="mr-2 size-4" />Reset engine defaults</Button>
        </section>
      </DialogContent>
    </Dialog>
  </>;
}
