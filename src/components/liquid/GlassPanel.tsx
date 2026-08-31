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
        backgroundColor: "var(--water-gel-bg)",
        backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
        borderRadius: `${18 + gel * 26}px`,
        border: "1px solid rgba(255, 255, 255, 0.22)",
        borderTopColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: `inset 0 ${1 + gel * 1.5}px ${2 + gel * 3}px 0 rgba(255, 255, 255, ${0.35 + gel * 0.3}), inset 0 -${2 + gel * 3}px ${4 + gel * 6}px 0 rgba(0, 0, 0, ${0.16 + gel * 0.2}), 0 ${8 + gel * 10}px ${32 + gel * 24}px 0 rgba(0, 0, 0, ${0.2 + gel * 0.22})`,
      }}
      className={cn(
        "liquid-panel relative overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 -z-10 rounded-[inherit]" />
      {children}
    </motion.div>
  );
}
