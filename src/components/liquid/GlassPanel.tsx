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

const DEFAULT_DROP_SHADOW = 100;
const DEFAULT_INNER_SHADOW = 100;
const DEFAULT_BLUR = 12;

function scopedVisualKey(key: string) {
  if (typeof window === "undefined") return key;
  try {
    const userId = localStorage.getItem("glass-notes-active-user-v1");
    return userId ? `${key}:${userId}` : key;
  } catch {
    return key;
  }
}

function readVisualSetting(key: string, fallback: number, min: number, max: number) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(scopedVisualKey(key));
    const value = Number(raw ?? fallback);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  } catch {
    return fallback;
  }
}

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

  const dropShadow = readVisualSetting("liquid-glass-drop-shadow-v1", DEFAULT_DROP_SHADOW, 0, 100) / 100;
  const innerShadow = readVisualSetting("liquid-glass-inner-shadow-v1", DEFAULT_INNER_SHADOW, 0, 100) / 100;
  const blur = readVisualSetting("liquid-glass-blur-v1", DEFAULT_BLUR, 0, 40);

  const topInnerAlpha = (0.35 + gel * 0.3) * innerShadow;
  const bottomInnerAlpha = (0.16 + gel * 0.2) * innerShadow;
  const outerShadowAlpha = (0.2 + gel * 0.22) * dropShadow;

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
        backdropFilter: `blur(${blur}px) saturate(200%) contrast(105%)`,
        borderRadius: `${18 + gel * 26}px`,
        border: "1px solid rgba(255, 255, 255, 0.22)",
        borderTopColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: `${innerShadow > 0 ? `inset 0 ${1 + gel * 1.5}px ${2 + gel * 3}px 0 rgba(255, 255, 255, ${topInnerAlpha})` : ""}${innerShadow > 0 && dropShadow > 0 ? ", " : ""}${innerShadow > 0 ? `inset 0 -${2 + gel * 3}px ${4 + gel * 6}px 0 rgba(0, 0, 0, ${bottomInnerAlpha})` : ""}${dropShadow > 0 ? `${innerShadow > 0 ? ", " : ""}0 ${8 + gel * 10}px ${32 + gel * 24}px 0 rgba(0, 0, 0, ${outerShadowAlpha})` : ""}`,
      }}
      className={cn(
        "liquid-panel relative overflow-hidden p-6 will-change-transform",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
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
        style={{ filter: "url(#liquid-refraction)" }}
      />
      <span aria-hidden className="liquid-veil pointer-events-none absolute inset-0 -z-10 rounded-[inherit]" />
      {children}
    </motion.div>
  );
}
