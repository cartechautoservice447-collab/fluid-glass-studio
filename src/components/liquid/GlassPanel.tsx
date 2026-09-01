import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  interactive?: boolean;
  onClick?: () => void;
};

export function GlassPanel({
  children,
  className,
  draggable = false,
  onClick,
  interactive = Boolean(onClick),
}: GlassPanelProps) {
  const { liquid } = useCustomization();

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;
  const transparency = liquid.transparency / 100;
  // Keep the panel coherent at both extremes: dark and solid at 0%, softly
  // frosted at high transparency. The visual response stays smooth instead of
  // exposing the displacement/filter layer as a dark cross-like artifact.
  const darkSurface = Math.max(0.18, 0.9 - transparency * 0.72);
  const lightSurface = Math.min(0.78, transparency * 0.78);
  const rimOpacity = 0.04 + transparency * 0.18;

  return (
    <motion.div
      onClick={onClick}
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={interactive ? { scale: 1.025, y: -4 } : {}}
      whileTap={interactive ? { scale: 0.96 } : {}}
      transition={spring}
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, ${lightSurface}) 0%, rgba(255, 255, 255, ${lightSurface * 0.18}) 55%, rgba(255, 255, 255, ${lightSurface * 0.7}) 100%), rgba(18, 22, 30, ${darkSurface})`,
        backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
        borderRadius: `${18 + gel * 26}px`,
        border: `1px solid rgba(255, 255, 255, ${0.18 + rimOpacity})`,
        borderTopColor: `rgba(255, 255, 255, ${0.28 + rimOpacity})`,
        boxShadow: `inset 0 ${1 + gel * 1.5}px ${2 + gel * 3}px 0 rgba(255, 255, 255, ${0.24 + gel * 0.22}), inset 0 -${2 + gel * 3}px ${4 + gel * 6}px 0 rgba(0, 0, 0, ${0.12 + gel * 0.14}), 0 ${8 + gel * 10}px ${32 + gel * 24}px 0 rgba(0, 0, 0, ${0.18 + gel * 0.18})`,
      }}
      className={cn(
        "liquid-panel relative overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.015) 55%, rgba(255, 255, 255, 0.07) 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/25 mix-blend-screen"
        style={{ opacity: rimOpacity }}
      />
      <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 rounded-[inherit]" />
      {children}
    </motion.div>
  );
}
