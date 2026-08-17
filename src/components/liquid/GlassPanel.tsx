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
      style={{
        backgroundColor: "var(--water-gel-bg)",
        backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
        borderRadius: `${18 + gel * 26}px`,
        borderTop: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow:
          "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
      className={cn(
        "liquid-panel relative overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {/* 3D surface gloss sheen across the top half */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%)",
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
    </motion.div>
  );
}
