import { motion } from "motion/react";
import { useId, useRef, type ReactNode } from "react";

import { useCustomization } from "@/context/CustomizationContext";
import { useLiquidGlassBox } from "@/components/liquid/LiquidGlassWebGL";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  glassId?: string;
  glassRadius?: number;
  glassBezel?: number;
};

export function GlassPanel({
  children,
  className,
  draggable = false,
  onClick,
  interactive = Boolean(onClick),
  glassId,
  glassRadius = 40,
  glassBezel = 45,
}: GlassPanelProps) {
  const { liquid } = useCustomization();
  const ref = useRef<HTMLDivElement | null>(null);
  const generatedId = useId().replace(/:/g, "-");
  const registrationId = glassId ?? `glass-panel-${generatedId}`;

  useLiquidGlassBox(ref, {
    id: registrationId,
    radius: glassRadius,
    bezel: glassBezel,
  });

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;
  const borderRadius = 18 + gel * 26;

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={interactive ? { scale: 1.025, y: -4 } : {}}
      whileTap={interactive ? { scale: 0.96 } : {}}
      transition={spring}
      style={{
        background: "transparent",
        borderRadius,
        border: "1px solid transparent",
        boxShadow: "none",
        position: "relative",
        zIndex: 30,
      }}
      className={cn(
        "liquid-panel liquid-webgl-panel overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
