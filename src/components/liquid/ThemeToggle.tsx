import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { useCustomization } from "@/context/CustomizationContext";

export function ThemeToggle() {
  const { theme, toggleTheme, liquid } = useCustomization();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={isDark}
      className="relative flex h-10 w-[4.75rem] items-center rounded-full border border-white/30 bg-white/15 px-1 backdrop-blur-xl transition-colors hover:bg-white/25"
      style={{ backdropFilter: "blur(var(--liquid-blur-effective, var(--liquid-density, 12px))) saturate(160%)" }}
    >
      <motion.span
        layout
        transition={{
          type: "spring",
          stiffness: liquid.bounceStiffness,
          damping: liquid.bounceDamping,
        }}
        className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        style={{ marginLeft: isDark ? "auto" : 0, marginRight: isDark ? 0 : "auto" }}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </motion.span>
      <span className="sr-only">{isDark ? "Night mode" : "Day mode"}</span>
    </button>
  );
}
