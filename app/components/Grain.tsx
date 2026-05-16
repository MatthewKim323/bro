// film grain. a fixed, full-viewport SVG turbulence overlay. always on,
// landing and app, so the whole product feels printed, not digital.
// see BRO_PLAN.md §3.3.
//
// the filter forces the noise OPAQUE (alpha = 1) and pushes it toward
// high-contrast black/white specks via feComponentTransfer. that is what
// makes overlay-blending actually visible: a neutral semi-transparent
// turbulence plane is a no-op over a light field. intensity is then
// controlled purely by .bro-grain { opacity } in globals.css.
//
// pointer-events:none and aria-hidden: it is texture, never UI.

export function Grain() {
  return (
    <div className="bro-grain" aria-hidden>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id="bro-grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.55"
            numOctaves={2}
            stitchTiles="stitch"
          />
          {/* RGB = mean(noise), A = 1  -> opaque gray noise plane */}
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0    0    0    0 1"
          />
          {/* spread around 0.5 -> near black/white film specks */}
          <feComponentTransfer>
            <feFuncR type="linear" slope="2.2" intercept="-0.6" />
            <feFuncG type="linear" slope="2.2" intercept="-0.6" />
            <feFuncB type="linear" slope="2.2" intercept="-0.6" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#bro-grain-filter)" />
      </svg>
    </div>
  );
}
