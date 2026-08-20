import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Opt-in animation primitives. Existing screens do not change until these
 * wrappers are explicitly used around a screen/panel.
 */
export const glassRefractionVariants: Variants = {
  initial: { opacity: 0, scale: 0.985, filter: "blur(10px) saturate(1.08)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px) saturate(1)" },
  exit: { opacity: 0, scale: 1.012, filter: "blur(8px) saturate(1.05)" },
};

export const liquidNavigationVariants: Variants = {
  initial: { opacity: 0, x: 18, scale: 0.985, borderRadius: 32 },
  animate: { opacity: 1, x: 0, scale: 1, borderRadius: 24 },
  exit: { opacity: 0, x: -18, scale: 0.985, borderRadius: 32 },
};

export function GlassRefraction({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={glassRefractionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </motion.div>
  );
}

export function LiquidNavigationMorph({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={liquidNavigationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity, border-radius" }}
    >
      {children}
    </motion.div>
  );
}
