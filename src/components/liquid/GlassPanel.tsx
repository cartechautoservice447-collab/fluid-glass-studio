import { motion } from "motion/react";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { registerGlassElement } from "@/lib/liquidGlassRegistry";
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

let glassPanelId = 0;
function nextGlassPanelId() {
  glassPanelId += 1;
  return `glass-panel-${glassPanelId}`;
}

export function GlassPanel({
  children,
  className,
  draggable = false,
  onClick,
  interactive = Boolean(onClick),
  glassId,
  glassRadius = 32,
  glassBezel = 42,
}: GlassPanelProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(glassId ?? nextGlassPanelId());

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    return registerGlassElement(idRef.current, element, {
      radius: glassRadius,
      bezel: glassBezel,
    });
  }, [glassBezel, glassRadius]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='button']") && target !== event.currentTarget) return;
    onClick();
  };

  return (
    <motion.div
      ref={elementRef}
      data-liquid-glass-surface="true"
      data-liquid-glass-id={idRef.current}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      drag={draggable}
      dragElastic={0.25}
      dragConstraints={{ left: -40, right: 40, top: -30, bottom: 30 }}
      dragSnapToOrigin
      whileHover={interactive ? { scale: 1.025, y: -4 } : {}}
      whileTap={interactive ? { scale: 0.96 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 18, mass: 0.6 }}
      className={cn(
        "relative overflow-hidden bg-transparent p-6 text-foreground outline-none",
        onClick && "cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
