import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Waves, Sparkles, Hand } from "lucide-react";

import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { GlassPanel } from "@/components/liquid/GlassPanel";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { CustomizationProvider, useCustomization } from "@/context/CustomizationContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Liquid Glass Engine — Real-Time Fluid Physics Playground" },
      {
        name: "description",
        content:
          "Test an Apple-style Liquid Glass engine: tune density, transparency, clearness, gel and spring bounce with live SVG refraction and specular highlights.",
      },
      { property: "og:title", content: "Liquid Glass Engine — Fluid Physics Playground" },
      {
        property: "og:description",
        content:
          "Five real-time sliders drive blur, alpha, turbulence, bevel and spring physics across live liquid glass panels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <CustomizationProvider>
      <LiquidFilters />
      <Playground />
    </CustomizationProvider>
  );
}

const CARDS = [
  {
    icon: Droplets,
    title: "Viscosity",
    body: "Density thickens the backdrop blur until the surface reads as poured glass.",
  },
  {
    icon: Waves,
    title: "Refraction",
    body: "An SVG displacement map warps the panel border like light bending in water.",
  },
  {
    icon: Sparkles,
    title: "Specular",
    body: "Move your cursor across a panel — the sheen tracks it in real time.",
  },
];

function Playground() {
  const { liquid } = useCustomization();

  return (
    <main className="liquid-stage relative min-h-screen overflow-hidden px-5 py-14 sm:px-8 lg:px-16">
      <div className="liquid-orb liquid-orb-a" aria-hidden />
      <div className="liquid-orb liquid-orb-b" aria-hidden />
      <div className="liquid-orb liquid-orb-c" aria-hidden />

      <div className="relative mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.34em] text-accent-foreground">
              Apple Liquid Glass Engine
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Real-time fluid physics, tuned by hand.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Density, transparency, clearness, gel and bounce are wired straight into root CSS
              variables and spring simulations. Open the engine to feel the difference.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <EngineSettingsModal />
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, body }) => (
            <GlassPanel key={title}>
              <Icon className="size-6 text-accent-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </GlassPanel>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <GlassPanel draggable className="min-h-[240px]">
            <div className="flex items-center gap-2 text-accent-foreground">
              <Hand className="size-5" />
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.22em]">
                Drag me
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Gel bounce, live
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              This panel is spring-driven: drag it, release it, click it. Stiffness{" "}
              {liquid.bounceStiffness} and damping {liquid.bounceDamping} decide how much the
              liquid wobbles before it settles.
            </p>
          </GlassPanel>

          <GlassPanel>
            <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-accent-foreground">
              Live engine state
            </h2>
            <dl className="mt-4 space-y-3 font-mono text-xs">
              {[
                ["--liquid-density", `${liquid.density}px`],
                ["--liquid-transparency", (liquid.transparency / 100).toFixed(2)],
                ["--liquid-clearness", `${liquid.clearness}`],
                ["--liquid-gel", `${liquid.gel}`],
                ["--liquid-bounce", `${liquid.bounceStiffness}`],
              ].map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}
