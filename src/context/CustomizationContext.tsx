import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LiquidSettings = {
  density: number;
  transparency: number;
  clearness: number;
  gel: number;
  bounceStiffness: number;
  bounceDamping: number;
};

export const LIQUID_DEFAULTS: LiquidSettings = {
  density: 12,
  transparency: 45,
  clearness: 35,
  gel: 55,
  bounceStiffness: 200,
  bounceDamping: 24,
};

const STORAGE_KEY = "liquid-glass-engine-v1";
const THEME_KEY = "liquid-glass-theme-v1";
const DISPLAY_NAME_KEY = "liquid-glass-display-name-v1";
const PURE_BLACK_KEY = "liquid-glass-pure-black-v1";

export type Theme = "light" | "dark";

type Ctx = {
  liquid: LiquidSettings;
  setLiquid: (patch: Partial<LiquidSettings>) => void;
  reset: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  pureBlack: boolean;
  setPureBlack: (value: boolean) => void;
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

function readLiquid(): LiquidSettings {
  if (typeof window === "undefined") return LIQUID_DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? sanitize(JSON.parse(stored)) : LIQUID_DEFAULTS;
  } catch {
    return LIQUID_DEFAULTS;
  }
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage failures.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function readPureBlack(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PURE_BLACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [liquid, setLiquidState] = useState<LiquidSettings>(readLiquid);
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [displayName, setDisplayNameState] = useState<string>(readDisplayName);
  const [pureBlack, setPureBlackState] = useState<boolean>(readPureBlack);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liquid));
    } catch {
      /* ignore quota/storage errors */
    }

    const root = document.documentElement;
    const transparency = liquid.transparency / 100;
    root.style.setProperty("--liquid-density", `${liquid.density}px`);
    root.style.setProperty("--liquid-transparency", `${transparency}`);
    root.style.setProperty("--liquid-glass-alpha", `${transparency}`);
    root.style.setProperty("--liquid-glass-dark-alpha", `${transparency * 0.16}`);
    root.style.setProperty("--liquid-veil-alpha", `${transparency * 0.36}`);
    // Keep the original behavior at/above the default, but prevent the dark
    // navy veil from flooding the glass when transparency is reduced below 45%.
    const darkVeilAlpha =
      transparency <= 0.45 ? 0.0775 + 0.45 * transparency : 0.46 - 0.4 * transparency;
    root.style.setProperty("--liquid-dark-veil-alpha", `${darkVeilAlpha}`);
    root.style.setProperty("--liquid-clearness", `${liquid.clearness}`);
    root.style.setProperty("--liquid-gel", `${liquid.gel}`);
    root.style.setProperty("--liquid-bounce", `${liquid.bounceStiffness}`);
    root.style.setProperty("--liquid-bounce-damping", `${liquid.bounceDamping}`);
  }, [liquid]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("pure-black", pureBlack);
    try {
      localStorage.setItem(PURE_BLACK_KEY, pureBlack ? "1" : "0");
    } catch {
      /* ignore storage errors */
    }
  }, [pureBlack]);

  const value = useMemo<Ctx>(
    () => ({
      liquid,
      setLiquid: (patch) => setLiquidState((prev) => sanitize({ ...prev, ...patch })),
      reset: () => setLiquidState(LIQUID_DEFAULTS),
      theme,
      setTheme: (next: Theme) => setThemeState(next),
      toggleTheme: () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
      displayName,
      setDisplayName: (name: string) => {
        const trimmed = name.trim().slice(0, 40);
        setDisplayNameState(trimmed);
        try {
          if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
          else localStorage.removeItem(DISPLAY_NAME_KEY);
        } catch {
          /* ignore storage errors */
        }
      },
      pureBlack,
      setPureBlack: (value: boolean) => {
        if (value) setThemeState("dark");
        setPureBlackState(value);
      },
    }),
    [liquid, theme, displayName, pureBlack],
  );

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error("useCustomization must be used inside CustomizationProvider");
  return ctx;
}
