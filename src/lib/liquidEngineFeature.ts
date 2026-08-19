/**
 * Liquid Glass Engine feature contract.
 *
 * This module centralizes the new Sharpness / Realism / Enabled feature so
 * existing components can opt into it without changing their unrelated logic.
 */
export const LIQUID_ENGINE_DEFAULTS = {
  sharpness: 50,
  realism: 50,
  enabled: true,
} as const;

export function clampLiquidEngine(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function getLiquidEdgeBlur(sharpness: number) {
  const value = clampLiquidEngine(sharpness);
  return value <= 50
    ? 5 - (value / 50) * 2.5
    : 2.5 - ((value - 50) / 50) * 2.1;
}

export function getLiquidSheen(realism: number) {
  const factor = clampLiquidEngine(realism) / 50;
  return {
    start: Math.min(1, 0.14 * factor),
    middle: Math.min(1, 0.02 * factor),
    end: Math.min(1, 0.09 * factor),
  };
}
