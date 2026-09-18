import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Hand, Sparkles, Waves } from "lucide-react";
import { useEffect, useState } from "react";

import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { CustomizationProvider } from "@/context/CustomizationContext";
import { LIQUID_GLASS_SETTINGS_EVENT, readLiquidGlassSettings, type LiquidGlassWebGLSettings } from "@/lib/liquidGlassSettings";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Liquid Glass Engine — Real-Time WebGL Playground" },
      { name: "description", content: "Inspect the shared WebGL Liquid Glass engine and live optical settings." },
      { property: "og:title", content: "Liquid Glass Engine — WebGL Playground" },
      { property: "og:description", content: "Tune the shared WebGL Liquid Glass engine with live shader settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CustomizationProvider>
      <Playground />
    </CustomizationProvider>
  );
}

const CARDS = [
  { icon: Droplets, title: "Thickness", body: "The exact shader displaces background pixels according to the glass surface depth." },
  { icon: Waves, title: "Refraction", body: "Rounded SDF edges drive Snell-law refraction and Poisson-disk optical blur." },
  { icon: Sparkles, title: "Dispersion", body: "The same shader separates red, green and blue samples at curved boundaries." },
];

function Playground() {
  const [glass, setGlass] = useState<LiquidGlassWebGLSettings>(readLiquidGlassSettings);

  useEffect(() => {
    const onChange = (event: Event) => {
      setGlass((event as CustomEvent<LiquidGlassWebGLSettings>).detail ?? readLiquidGlassSettings());
    };
    window.addEventListener(LIQUID_GLASS_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(LIQUID_GLASS_SETTINGS_EVENT, onChange);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-5 py-14 sm:px-8 lg:px-16">
      <div className="relative z-[2] mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.34em] text-white/70">WebGL Liquid Glass Engine</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">Real-time optical glass, driven by the shared renderer.</h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">These panels use the same WebGL shader, renderer, box registry, animation clock, resize handling and performance modes used throughout the application.</p>
          </div>
          <div className="flex items-center gap-3"><ThemeToggle /><EngineSettingsModal /></div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, body }) => (
            <GlassPanel key={title} glassId={`demo-${title.toLowerCase()}`} glassRadius={30} glassBezel={42}>
              <Icon className="size-6 text-white" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </GlassPanel>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <GlassPanel glassId="demo-drag" draggable className="min-h-[240px]" glassRadius={32} glassBezel={48}>
            <div className="flex items-center gap-2 text-white"><Hand className="size-5" /><span className="text-[0.66rem] font-bold uppercase tracking-[0.22em]">Drag me</span></div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">WebGL Liquid Glass, live</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Drag this glass surface and watch the UI interaction remain separate from the shader's continuous liquid animation.</p>
          </GlassPanel>

          <GlassPanel glassId="demo-state" glassRadius={32} glassBezel={48}>
            <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-white/80">Live WebGL state</h2>
            <dl className="mt-4 space-y-3 font-mono text-xs">
              {[
                ["thickness", `${glass.thickness}px`],
                ["bezel", `${glass.bezel}px`],
                ["ior", glass.ior.toFixed(2)],
                ["blur", glass.blur.toFixed(1)],
                ["specular", glass.specular.toFixed(2)],
                ["tint", glass.tint.toFixed(2)],
                ["shadow", glass.shadow.toFixed(2)],
                ["dispersion", glass.dispersion.toFixed(2)],
              ].map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3"><dt className="text-white/65">{key}</dt><dd className="text-white">{value}</dd></div>
              ))}
            </dl>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}
