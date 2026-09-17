import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { useCustomization } from "@/context/CustomizationContext";

export function ThemeToggle() {
  const { theme, toggleTheme, liquid } = useCustomization();
  const isDark = theme === "dark";

  return (
    <GlassPanel
      glassId="theme-toggle"
      glassRadius={999}
      glassBezel={28}
      className="h-10 w-[4.75rem] !p-0"
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
        aria-pressed={isDark}
        className="relative flex h-full w-full items-center rounded-full px-1 transition-colors hover:bg-white/10"
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
    </GlassPanel>
  );
}
