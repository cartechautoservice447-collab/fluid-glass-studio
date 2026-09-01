/**
 * Global SVG filter definitions used by the Liquid Glass engine.
 * Rendered once; panels reference the filters by id (e.g. filter: url(#liquid-refraction)).
 */
export function LiquidFilters() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
      <defs>
        <filter id="liquid-refraction" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={3} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="liquid-edge-glow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feSpecularLighting in="blur" surfaceScale={2} specularConstant={0.6} specularExponent={20} lightingColor="#ffffff" result="spec">
            <fePointLight x={-200} y={-200} z={300} />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClipped" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="specClipped" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
