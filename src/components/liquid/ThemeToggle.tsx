import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef } from "react";

import { registerGlassElement } from "@/lib/liquidGlassRegistry";
import { useCustomization } from "@/context/CustomizationContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useCustomization();
  const isDark = theme === "dark";
  const elementRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    return registerGlassElement("theme-toggle", element, { radius: 24, bezel: 28 });
  }, []);

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={isDark}
      data-liquid-glass-surface="true"
      className="relative flex h-10 w-[4.75rem] items-center rounded-full border border-white/25 bg-transparent px-1 transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 260, damping: 18, mass: 0.6 }}
        className="flex size-8 items-center justify-center rounded-full bg-white/15 text-foreground shadow-lg"
        style={{ marginLeft: isDark ? "auto" : 0, marginRight: isDark ? 0 : "auto" }}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </motion.span>
      <span className="sr-only">{isDark ? "Night mode" : "Day mode"}</span>
    </button>
  );
}
