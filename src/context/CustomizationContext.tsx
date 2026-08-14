import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LiquidSettings = {
  density: number; // blur px 0 - 40
  transparency: number; // panel opacity 5 - 95 (%)
  clearness: number; // turbulence index 0 - 100
  gel: number; // bevel / surface tension 0 - 100
  bounceStiffness: number; // 100 - 500
  bounceDamping: number; // 10 - 40
};

export const LIQUID_DEFAULTS: LiquidSettings = {
  density: 18,
  transparency: 45,
  clearness: 35,
  gel: 55,
  bounceStiffness: 260,
  bounceDamping: 18,
};

const STORAGE_KEY = "liquid-glass-engine-v1";
const THEME_KEY = "liquid-glass-theme-v1";

export type Theme = "light" | "dark";

type Ctx = {
  liquid: LiquidSettings;
  setLiquid: (patch: Partial<LiquidSettings>) => void;
  reset: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const CustomizationContext = createContext<Ctx | null>(null);

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function sanitize(raw: unknown): LiquidSettings {
  const v = (raw ?? {}) as Partial<LiquidSettings>;
  return {
    density: clamp(Number(v.density ?? LIQUID_DEFAULTS.density), 0, 40),
    transparency: clamp(Number(v.transparency ?? LIQUID_DEFAULTS.transparency), 5, 95),
    clearness: clamp(Number(v.clearness ?? LIQUID_DEFAULTS.clearness), 0, 100),
    gel: clamp(Number(v.gel ?? LIQUID_DEFAULTS.gel), 0, 100),
    bounceStiffness: clamp(Number(v.bounceStiffness ?? LIQUID_DEFAULTS.bounceStiffness), 100, 500),
    bounceDamping: clamp(Number(v.bounceDamping ?? LIQUID_DEFAULTS.bounceDamping), 10, 40),
  };
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [liquid, setLiquidState] = useState<LiquidSettings>(LIQUID_DEFAULTS);

  // Read persisted state after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLiquidState(sanitize(JSON.parse(stored)));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liquid));
    } catch {
      /* ignore quota errors */
    }
    const root = document.documentElement;
    root.style.setProperty("--liquid-density", `${liquid.density}px`);
    root.style.setProperty("--liquid-transparency", `${liquid.transparency / 100}`);
    root.style.setProperty("--liquid-clearness", `${liquid.clearness}`);
    root.style.setProperty("--liquid-gel", `${liquid.gel}`);
    root.style.setProperty("--liquid-bounce", `${liquid.bounceStiffness}`);
    root.style.setProperty("--liquid-bounce-damping", `${liquid.bounceDamping}`);
  }, [liquid]);

  const value = useMemo<Ctx>(
    () => ({
      liquid,
      setLiquid: (patch) => setLiquidState((prev) => sanitize({ ...prev, ...patch })),
      reset: () => setLiquidState(LIQUID_DEFAULTS),
    }),
    [liquid],
  );

  return (
    <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error("useCustomization must be used inside CustomizationProvider");
  return ctx;
}
