import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
};

/**
 * A hyper-realistic 3D liquid water slab: transparent interior, glossy top
 * reflection, dual bevel volume, crystal border highlight, and elastic gel
 * bounce driven by the Liquid Bounce slider.
 */
export function GlassPanel({ children, className, draggable = false }: GlassPanelProps) {
  const { liquid } = useCustomization();

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;
  const alpha = (liquid.transparency ?? 45) / 100;

  return (
    <motion.div
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={{ scale: 1.025, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      style={{
        // panel interior stays transparent — the deep blue backdrop shines through
        backgroundColor: `color-mix(in oklch, var(--glass-tint) ${alpha * 100}%, transparent)`,
        backdropFilter: "blur(var(--liquid-density, 24px)) saturate(200%) brightness(1.1)",
        borderRadius: `${28 + gel * 8}px`,
        boxShadow: [
          // crisp top light bevel
          "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.6)",
          // deep bottom shadow for slab thickness
          "inset 0 -2px 4px 0 rgba(0, 0, 0, 0.35)",
          // soft gel sheen glow
          `inset 0 ${1 + gel * 2}px ${3 + gel * 8}px color-mix(in oklch, var(--liquid-sheen) ${12 + gel * 22}%, transparent)`,
          // underside shade
          `inset 0 -${1 + gel * 3}px ${4 + gel * 12}px color-mix(in oklch, var(--glass-shade) ${14 + gel * 26}%, transparent)`,
          // floating volume shadow
          "0 12px 32px rgba(0, 0, 0, 0.4)",
          `0 ${8 + gel * 20}px ${24 + gel * 44}px color-mix(in oklch, var(--glass-shade) ${22 + gel * 22}%, transparent)`,
        ].join(", "),
      }}
      className={cn(
        "liquid-panel group relative overflow-hidden border border-white/30 p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {/* refracted liquid edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/35 opacity-70 mix-blend-screen"
        style={{ filter: "url(#liquid-refraction)" }}
      />
      {/* glossy top reflection — curved water droplet surface */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[inherit] opacity-60 transition-opacity duration-300 group-hover:opacity-80"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0) 100%)",
        }}
      />
      {/* crystal border specular highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/20 opacity-50"
      />
      {/* legibility veil — keeps text readable on both frosted and obsidian glass */}
      <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 rounded-[inherit]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

