import { useCustomization } from "@/context/CustomizationContext";

/**
 * Global SVG displacement filter used for liquid glass edge refraction.
 * Rendered once (hidden) so panels can reference url(#liquid-refraction).
 */
export function LiquidFilters() {
  const { liquid } = useCustomization();
  const clearness = Number(liquid?.clearness ?? 50);
  const frequency = (0.006 + (clearness / 100) * 0.02).toFixed(4);
  const scale = Math.max(1, Math.min(6, 1 + clearness / 20));

  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default LiquidFilters;
