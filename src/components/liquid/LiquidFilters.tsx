import { useCustomization } from "@/context/CustomizationContext";

/**
 * Global SVG displacement filter used to fake liquid-glass refraction on
 * panel edges. Turbulence frequency is driven by "Liquid Clearness":
 * a clearer liquid = lower turbulence + lower displacement scale.
 */
export function LiquidFilters() {
  const { liquid } = useCustomization();
  const clarity = liquid.clearness / 100; // 0 murky .. 1 crystal
  const frequency = (0.004 + (1 - clarity) * 0.045).toFixed(4);
  const scale = Math.round(4 + (1 - clarity) * 46);
  const octaves = 1 + Math.round((1 - clarity) * 3);

  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0" focusable="false">
      <defs>
        <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={octaves}
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
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
