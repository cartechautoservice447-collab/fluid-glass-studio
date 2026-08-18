import { Settings2, RotateCcw } from "lucide-react";
import { useState } from "react";

import { LiquidSlider } from "@/components/liquid/LiquidSlider";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCustomization } from "@/context/CustomizationContext";

export function EngineSettingsModal() {
  const { liquid, setLiquid, reset, theme, displayName, setDisplayName } = useCustomization();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-white/30 bg-white/10 backdrop-blur-xl hover:bg-white/20"
        >
          <Settings2 className="mr-2 size-4" />
          Engine Customization
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto border-white/25 bg-white/10 backdrop-blur-2xl sm:max-w-lg"
        style={{ backdropFilter: "blur(calc(var(--liquid-density) + 8px)) saturate(170%)" }}
      >
        <DialogHeader>
          <DialogTitle className="tracking-tight">Engine Customization</DialogTitle>
          <DialogDescription>
            Tune the Apple Liquid Glass Engine. Every change is live and remembered.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-6 pt-2">
          <div className="space-y-2 rounded-2xl border border-white/20 bg-white/5 p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">
              Profile
            </p>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="border-white/20 bg-white/10"
            />
            <p className="text-xs text-muted-foreground">
              Shown in the welcome greeting on your course grid.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/5 p-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground">
                Appearance
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {theme === "dark" ? "Night mode — obsidian liquid" : "Day mode — bright liquid"}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3">
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-foreground">
              Liquid Glass Physics
            </h3>
            <span className="h-px flex-1 bg-gradient-to-r from-white/40 to-transparent" />
          </div>

          <LiquidSlider
            label="Liquid Density"
            hint="Viscosity & refraction — backdrop blur radius of every glass surface."
            value={liquid.density}
            min={0}
            max={40}
            display={`${liquid.density}px`}
            onChange={(density) => setLiquid({ density })}
          />
          <LiquidSlider
            label="Liquid Transparency"
            hint="Alpha blending — how much of the world behind shows through the panel."
            value={liquid.transparency}
            min={5}
            max={95}
            display={`${liquid.transparency}%`}
            onChange={(transparency) => setLiquid({ transparency })}
          />
          <LiquidSlider
            label="Liquid Clearness"
            hint="Distortion & glare clarity — SVG turbulence index on refracted edges."
            value={liquid.clearness}
            min={0}
            max={100}
            display={`${liquid.clearness} idx`}
            onChange={(clearness) => setLiquid({ clearness })}
          />
          <LiquidSlider
            label="Liquid Gel"
            hint="Surface tension curves, 3D inner bevel and drop shadow depth."
            value={liquid.gel}
            min={0}
            max={100}
            display={`${liquid.gel}%`}
            onChange={(gel) => setLiquid({ gel })}
          />
          <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-4">
            <LiquidSlider
              label="Liquid Bounce · Stiffness"
              hint="Spring stiffness driving the gel bounce on hover, click and drag."
              value={liquid.bounceStiffness}
              min={100}
              max={500}
              step={5}
              display={`${liquid.bounceStiffness}`}
              onChange={(bounceStiffness) => setLiquid({ bounceStiffness })}
            />
            <LiquidSlider
              label="Liquid Bounce · Damping"
              hint="Lower damping = wobblier liquid; higher damping settles instantly."
              value={liquid.bounceDamping}
              min={10}
              max={40}
              display={`${liquid.bounceDamping}`}
              onChange={(bounceDamping) => setLiquid({ bounceDamping })}
            />
          </div>

          <Button variant="secondary" className="w-full" onClick={reset}>
            <RotateCcw className="mr-2 size-4" />
            Reset engine defaults
          </Button>
        </section>
      </DialogContent>
    </Dialog>
  );
}
