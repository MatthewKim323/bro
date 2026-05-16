// film grain. a fixed, full-viewport SVG turbulence overlay composited
// in soft-light at ~6% opacity. always on, landing and app, so the
// whole product feels printed instead of digital. see BRO_PLAN.md §3.3.
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
            baseFrequency="0.9"
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bro-grain-filter)" />
      </svg>
    </div>
  );
}
