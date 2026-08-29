import { useCustomization } from "@/context/CustomizationContext";

/**
 * Global SVG refraction filter for panel edges. Base turbulence/frequency is
 * driven by "Liquid Clearness" (a clearer liquid = less turbulence, smaller
 * displacement). "Liquid Refraction" then applies an independent multiplier
 * on top of that base scale, so it can exaggerate or flatten the same warp.
 */
export function LiquidFilters() {
  const { liquid } = useCustomization();
  const clarity = liquid.clearness / 100; // 0 murky .. 1 crystal
  const frequency = (0.006 + (1 - clarity) * 0.02).toFixed(4);
  // Keep the scale tiny — large displacement was shredding the border ("cracks").
  const baseScale = 1 + (1 - clarity) * 5;
  // At the default of 40, multiplier is 1 (matches original behavior).
  const refractionMultiplier = liquid.refraction / 40;
  const scale = Number((baseScale * refractionMultiplier).toFixed(2));

  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0" focusable="false">
      <defs>
        <filter id="liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={2}
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise" />
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
