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
  const { liquid, liquidVisual } = useCustomization();

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;
  const clearness = liquid.clearness / 100;
  const drop = liquidVisual.dropShadow / 100;
  const inner = liquidVisual.innerShadow / 100;
  const blurPx = Math.max(0, liquid.density + (liquidVisual.blur - 12));
  const topInnerAlpha = (0.35 + gel * 0.3) * inner;
  const bottomInnerAlpha = (0.16 + gel * 0.2) * inner;
  const outerShadowAlpha = (0.2 + gel * 0.22) * drop;
  const fluidHighlightOpacity = 0.035 + clearness * 0.075;
  const fluidMotionDuration = Math.max(7, 13 - clearness * 4);

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
        backdropFilter: `blur(${blurPx}px) saturate(200%) contrast(105%)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(200%) contrast(105%)`,
        borderRadius: `${18 + gel * 26}px`,
        border: "1px solid rgba(255, 255, 255, 0.22)",
        borderTopColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: `inset 0 ${1 + gel * 1.5}px ${2 + gel * 3}px 0 rgba(255, 255, 255, ${topInnerAlpha}), inset 0 -${2 + gel * 3}px ${4 + gel * 6}px 0 rgba(0, 0, 0, ${bottomInnerAlpha}), 0 ${8 + gel * 10}px ${32 + gel * 24}px 0 rgba(0, 0, 0, ${outerShadowAlpha})`,
      }}
      className={cn(
        "liquid-panel relative overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-[18%] -z-10 rounded-[inherit]"
        animate={{
          x: ["-12%", "10%", "-6%", "12%", "-12%"],
          y: ["4%", "-6%", "7%", "-4%", "4%"],
          rotate: [-2, 1.5, -1, 2, -2],
          scale: [1, 1.035, 0.99, 1.025, 1],
        }}
        transition={{ duration: fluidMotionDuration, ease: "easeInOut", repeat: Infinity }}
        style={{
          opacity: fluidHighlightOpacity,
          background: "radial-gradient(ellipse at 28% 24%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.32) 18%, transparent 48%), radial-gradient(ellipse at 72% 74%, rgba(255,255,255,0.2) 0%, transparent 52%)",
          filter: `blur(${Math.max(10, blurPx * 0.7)}px) saturate(${135 + clearness * 45}%)`,
          mixBlendMode: "screen",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 55%, rgba(255, 255, 255, 0.09) 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] border border-white/35 mix-blend-screen opacity-25"
        style={{ filter: `url(#liquid-refraction) blur(${Math.max(0, (1 - clearness) * 0.5)}px)` }}
      />
      <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 -z-10 rounded-[inherit]" />
      {children}
    </motion.div>
  );
}
