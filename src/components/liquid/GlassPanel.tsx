import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  as?: "div" | "section" | "article";
};

/**
 * A liquid-glass surface: alpha blended, blurred, gel-beveled, spring
 * animated and lit by a cursor-following specular highlight.
 */
export function GlassPanel({ children, className, draggable = false }: GlassPanelProps) {
  const { liquid } = useCustomization();
  const mx = useMotionValue(50);
  const my = useMotionValue(0);
  const sheen = useMotionTemplate`radial-gradient(circle 220px at ${mx}% ${my}%, color-mix(in oklch, var(--liquid-sheen) ${20 + liquid.gel * 0.5}%, transparent), transparent 70%)`;

  const spring = {
    type: "spring" as const,
    stiffness: liquid.bounceStiffness,
    damping: liquid.bounceDamping,
    mass: 0.6 + liquid.gel / 140,
  };

  const gel = liquid.gel / 100;

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 100);
    my.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <motion.div
      onPointerMove={handleMove}
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.965 }}
      transition={spring}
      style={{
        background:
          "linear-gradient(140deg, color-mix(in oklch, var(--glass-tint) calc(var(--liquid-transparency) * 100%), transparent), color-mix(in oklch, var(--glass-tint-2) calc(var(--liquid-transparency) * 70%), transparent))",
        backdropFilter: "blur(var(--liquid-density)) saturate(160%)",
        borderRadius: `${18 + gel * 26}px`,
        boxShadow: `inset 0 ${1 + gel * 2}px ${2 + gel * 10}px color-mix(in oklch, white ${18 + gel * 45}%, transparent), inset 0 -${1 + gel * 3}px ${4 + gel * 14}px color-mix(in oklch, var(--glass-shade) ${20 + gel * 40}%, transparent), 0 ${8 + gel * 22}px ${24 + gel * 50}px color-mix(in oklch, var(--glass-shade) ${25 + gel * 25}%, transparent)`,
      }}
      className={cn(
        "relative overflow-hidden border border-white/25 p-6 will-change-transform",
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
      {/* cursor specular sheen */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
        style={{ backgroundImage: sheen }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
