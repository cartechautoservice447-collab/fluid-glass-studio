export type LiquidGlassThemeId = "type-1" | "type-2" | "type-3" | "type-4";

export type LiquidGlassThemeOption = {
  id: LiquidGlassThemeId;
  label: string;
  description: string;
  preview: string;
};

export const LIQUID_GLASS_THEME_KEY = "liquid-glass-theme-v1";
export const LIQUID_GLASS_THEME_EVENT = "liquid-glass-theme-changed";
export const LIQUID_GLASS_THEME_DEFAULT: LiquidGlassThemeId = "type-1";

export const LIQUID_GLASS_THEME_OPTIONS: LiquidGlassThemeOption[] = [
  {
    id: "type-1",
    label: "Type 1",
    description: "Dashboard glass",
    preview:
      "linear-gradient(135deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,.02) 55%,rgba(255,255,255,.09) 100%)",
  },
  {
    id: "type-2",
    label: "Type 2",
    description: "Course card glass",
    preview:
      "radial-gradient(circle at 0% 0%,rgba(114,215,255,.40),transparent 58%),linear-gradient(145deg,rgba(255,255,255,.17),rgba(255,255,255,.035))",
  },
  {
    id: "type-3",
    label: "Type 3",
    description: "Progress box glass",
    preview:
      "linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.025))",
  },
  {
    id: "type-4",
    label: "Type 4",
    description: "Saved notes glass",
    preview:
      "radial-gradient(circle at 0% 0%,rgba(255,255,255,.20),transparent 58%),linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.045))",
  },
];

const VALID_THEMES = new Set<LiquidGlassThemeId>(
  LIQUID_GLASS_THEME_OPTIONS.map((option) => option.id),
);

export function isLiquidGlassThemeId(value: unknown): value is LiquidGlassThemeId {
  return typeof value === "string" && VALID_THEMES.has(value as LiquidGlassThemeId);
}

export function readLiquidGlassTheme(): LiquidGlassThemeId {
  if (typeof window === "undefined") return LIQUID_GLASS_THEME_DEFAULT;
  try {
    const raw = window.localStorage.getItem(LIQUID_GLASS_THEME_KEY);
    return isLiquidGlassThemeId(raw) ? raw : LIQUID_GLASS_THEME_DEFAULT;
  } catch {
    return LIQUID_GLASS_THEME_DEFAULT;
  }
}

export function applyLiquidGlassTheme(theme: LiquidGlassThemeId) {
  if (typeof document === "undefined") return theme;
  document.documentElement.dataset.glassTheme = theme;
  return theme;
}

export function writeLiquidGlassTheme(theme: LiquidGlassThemeId) {
  const next = isLiquidGlassThemeId(theme) ? theme : LIQUID_GLASS_THEME_DEFAULT;
  try {
    window.localStorage.setItem(LIQUID_GLASS_THEME_KEY, next);
  } catch {
    // Keep the current visual theme when storage is unavailable.
  }
  applyLiquidGlassTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<LiquidGlassThemeId>(LIQUID_GLASS_THEME_EVENT, { detail: next }),
    );
  }
  return next;
}
