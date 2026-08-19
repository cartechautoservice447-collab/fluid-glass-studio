import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

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

// Kept as an offline cache only — Supabase is the source of truth once signed in.
const STORAGE_KEY = "liquid-glass-engine-v1";
const THEME_KEY = "liquid-glass-theme-v1";
const DISPLAY_NAME_KEY = "liquid-glass-display-name-v1";

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

type ProfileRow = {
  theme?: string | null;
  display_name?: string | null;
  liquid_density?: number | null;
  liquid_transparency?: number | null;
  liquid_clearness?: number | null;
  liquid_gel?: number | null;
  liquid_bounce_stiffness?: number | null;
  liquid_bounce_damping?: number | null;
};

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [liquid, setLiquidState] = useState<LiquidSettings>(LIQUID_DEFAULTS);
  const [theme, setThemeState] = useState<Theme>("light");
  const [displayName, setDisplayNameState] = useState("");
  const loadedProfileFor = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local cache first (instant paint, works offline / signed out).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLiquidState(sanitize(JSON.parse(stored)));
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }
      const storedName = localStorage.getItem(DISPLAY_NAME_KEY);
      if (storedName) setDisplayNameState(storedName);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // Then hydrate from the signed-in user's profile row (source of truth).
  useEffect(() => {
    if (!userId || loadedProfileFor.current === userId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "theme, display_name, liquid_density, liquid_transparency, liquid_clearness, liquid_gel, liquid_bounce_stiffness, liquid_bounce_damping",
        )
        .eq("id", userId)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const row = data as ProfileRow;
      loadedProfileFor.current = userId;
      setLiquidState(
        sanitize({
          density: Number(row.liquid_density ?? LIQUID_DEFAULTS.density),
          transparency: Number(row.liquid_transparency ?? LIQUID_DEFAULTS.transparency),
          clearness: Number(row.liquid_clearness ?? LIQUID_DEFAULTS.clearness),
          gel: Number(row.liquid_gel ?? LIQUID_DEFAULTS.gel),
          bounceStiffness: Number(row.liquid_bounce_stiffness ?? LIQUID_DEFAULTS.bounceStiffness),
          bounceDamping: Number(row.liquid_bounce_damping ?? LIQUID_DEFAULTS.bounceDamping),
        }),
      );
      if (row.theme === "light" || row.theme === "dark") setThemeState(row.theme);
      if (row.display_name) setDisplayNameState(row.display_name);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) loadedProfileFor.current = null;
  }, [userId]);

  // Debounced persistence to the profile row.
  const persist = useCallback(
    (patch: Record<string, unknown>) => {
      if (!userId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void supabase.from("profiles").upsert({ id: userId, ...patch });
      }, 400);
    },
    [userId],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore quota errors */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liquid));
    } catch {
      /* ignore quota errors */
    }
    const root = document.documentElement;
    const transparency = liquid.transparency / 100;
    root.style.setProperty("--liquid-density", `${liquid.density}px`);
    root.style.setProperty("--liquid-transparency", `${transparency}`);
    root.style.setProperty("--liquid-glass-alpha", `${transparency}`);
    root.style.setProperty("--liquid-glass-dark-alpha", `${transparency * 0.16}`);
    root.style.setProperty("--liquid-veil-alpha", `${transparency * 0.36}`);
    root.style.setProperty("--liquid-dark-veil-alpha", `${0.46 - transparency * 0.4}`);
    root.style.setProperty("--liquid-clearness", `${liquid.clearness}`);
    root.style.setProperty("--liquid-gel", `${liquid.gel}`);
    root.style.setProperty("--liquid-bounce", `${liquid.bounceStiffness}`);
    root.style.setProperty("--liquid-bounce-damping", `${liquid.bounceDamping}`);
  }, [liquid]);

  const commitLiquid = useCallback(
    (next: LiquidSettings) => {
      persist({
        liquid_density: next.density,
        liquid_transparency: next.transparency,
        liquid_clearness: next.clearness,
        liquid_gel: next.gel,
        liquid_bounce_stiffness: next.bounceStiffness,
        liquid_bounce_damping: next.bounceDamping,
      });
    },
    [persist],
  );

  const value = useMemo<Ctx>(
    () => ({
      liquid,
      setLiquid: (patch) =>
        setLiquidState((prev) => {
          const next = sanitize({ ...prev, ...patch });
          commitLiquid(next);
          return next;
        }),
      reset: () => {
        setLiquidState(LIQUID_DEFAULTS);
        commitLiquid(LIQUID_DEFAULTS);
      },
      theme,
      setTheme: (next: Theme) => {
        setThemeState(next);
        persist({ theme: next });
      },
      toggleTheme: () =>
        setThemeState((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          persist({ theme: next });
          return next;
        }),
      displayName,
      setDisplayName: (name: string) => {
        const trimmed = name.trim().slice(0, 40);
        setDisplayNameState(trimmed);
        persist({ display_name: trimmed || null });
        try {
          if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
          else localStorage.removeItem(DISPLAY_NAME_KEY);
        } catch {
          /* ignore quota errors */
        }
      },
    }),
    [liquid, theme, displayName, commitLiquid, persist],
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
