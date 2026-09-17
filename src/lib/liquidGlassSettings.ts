export type LiquidGlassWebGLSettings = {
  thickness: number;
  bezel: number;
  ior: number;
  blur: number;
  specular: number;
  tint: number;
  shadow: number;
  dispersion: number;
};

export const LIQUID_GLASS_DEFAULTS: LiquidGlassWebGLSettings = {
  thickness: 50,
  bezel: 55,
  ior: 3,
  blur: 1.5,
  specular: 0.55,
  tint: 0.08,
  shadow: 0.5,
  dispersion: 1.9,
};

export const LIQUID_GLASS_SETTINGS_KEY = "liquid-glass-webgl-settings-v1";
export const LIQUID_GLASS_SETTINGS_EVENT = "liquid-glass-settings-changed";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function sanitizeLiquidGlassSettings(raw: unknown): LiquidGlassWebGLSettings {
  const value = (raw ?? {}) as Partial<LiquidGlassWebGLSettings>;
  const number = (input: unknown, fallback: number, min: number, max: number) => {
    const parsed = Number(input ?? fallback);
    return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
  };

  return {
    thickness: number(value.thickness, 50, 1, 120),
    bezel: number(value.bezel, 55, 4, 100),
    ior: number(value.ior, 3, 1, 4),
    blur: number(value.blur, 1.5, 0, 8),
    specular: number(value.specular, 0.55, 0, 1),
    tint: number(value.tint, 0.08, 0, 0.35),
    shadow: number(value.shadow, 0.5, 0, 1),
    dispersion: number(value.dispersion, 1.9, 0, 4),
  };
}

export function readLiquidGlassSettings(): LiquidGlassWebGLSettings {
  if (typeof window === "undefined") return LIQUID_GLASS_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(LIQUID_GLASS_SETTINGS_KEY);
    return raw ? sanitizeLiquidGlassSettings(JSON.parse(raw)) : LIQUID_GLASS_DEFAULTS;
  } catch {
    return LIQUID_GLASS_DEFAULTS;
  }
}

export function writeLiquidGlassSettings(patch: Partial<LiquidGlassWebGLSettings>) {
  const next = sanitizeLiquidGlassSettings({ ...readLiquidGlassSettings(), ...patch });
  try {
    window.localStorage.setItem(LIQUID_GLASS_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent<LiquidGlassWebGLSettings>(LIQUID_GLASS_SETTINGS_EVENT, { detail: next }),
    );
  } catch {
    // Storage can be unavailable in restricted browsing contexts; the active renderer keeps its current state.
  }
  return next;
}

export function resetLiquidGlassSettings() {
  return writeLiquidGlassSettings(LIQUID_GLASS_DEFAULTS);
}
