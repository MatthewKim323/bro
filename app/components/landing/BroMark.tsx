// the bro mascot, rebuilt as a clean SVG from the provided raster (which
// had a baked checkerboard, no real alpha). transparent by construction,
// recolors via the palette tokens, and the eyes are real elements so
// they can blink. blink is pure CSS (see BroMark.css), on hover.

import "./BroMark.css";

export function BroMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`bro-mark ${className}`.trim()}
      viewBox="0 0 64 64"
      role="img"
      aria-label="bro"
    >
      <rect
        x="8"
        y="7"
        width="48"
        height="50"
        rx="21"
        fill="var(--color-sage-deep)"
      />
      <rect
        className="bro-eye"
        x="21"
        y="24.5"
        width="5.6"
        height="13"
        rx="2.8"
        fill="var(--color-bg)"
      />
      <rect
        className="bro-eye"
        x="37.4"
        y="24.5"
        width="5.6"
        height="13"
        rx="2.8"
        fill="var(--color-bg)"
      />
    </svg>
  );
}
