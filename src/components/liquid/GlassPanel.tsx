import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  onClick?: () => void;
};

/**
 * A crystal-clear 3D water-gel lens: transparent tinted interior, layered
 * inset lighting bevel, vivid backdrop optics, diagonal surface gloss sheen,
 * and organic spring physics driven by the Liquid Bounce slider.
 *
 * Structural note: the hover/tap/drag transform lives on the OUTER
 * motion.div only, with nothing else on it. All backdrop-filter /
 * overflow-hidden / border-radius / caller layout classes live on the
 * INNER div, which never carries its own transform. If backdrop-filter
 * and an active CSS transform sit on the same clipped element, the browser
 * has to re-sample blur pixels at the newly-revealed rounded corners every
 * animation frame — and on scale it can fail there, flashing black at the
 * corners. Splitting outer (moves) / inner (blurs, stays put) means the
 * transform just repositions one already-composited layer instead of
 * re-blurring it mid-animation, which is what was causing the black
 * corners on hover.
 */
export function GlassPanel({ children, className, draggable = false, onClick }: GlassPanelProps) {
  const { liquid } = useCustomization();

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;
  const radius = `${18 + gel * 26}px`;

  return (
    <motion.div
      onClick={onClick}
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={{ scale: 1.025, y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={cn("relative h-full w-full will-change-transform", draggable && "cursor-grab active:cursor-grabbing")}
    >
      {/* Glass surface — carries every class the caller used to pass to
          the single element (padding overrides like !p-4/!p-5, flex
          layout, the selected-note ring, cursor-pointer, etc.) plus the
          fixed glass styling. This element never has its own transform,
          so backdrop-filter never has to resample mid-scale. */}
      <div
        className={cn("liquid-panel relative h-full w-full overflow-hidden p-6", className)}
        style={{
          backgroundColor: "var(--water-gel-bg)",
          backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
          borderRadius: radius,
          borderTop: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow:
            "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
      >
        {/* 3D surface gloss sheen across the top half */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 55%, rgba(255, 255, 255, 0.09) 100%)",
          }}
        />
        {/* refracted liquid edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] border border-white/35 opacity-70 mix-blend-screen"
          style={{ filter: "url(#liquid-refraction)" }}
        />
        {/* legibility veil — keeps text readable on both frosted and obsidian glass */}
        <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 -z-10 rounded-[inherit]" />
        {children}
      </div>
    </motion.div>
  );
}
