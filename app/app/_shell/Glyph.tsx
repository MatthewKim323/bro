// the panel glyphs. thin, geometric, monochrome line marks that inherit
// currentColor so the sidebar tints them by state. no emoji, no brand
// logos, nothing that fights the calm. ~18px, 1.4 stroke. one family.
// see BRO_PLAN.md §3 (calm, drawn, in-palette).

import type { PanelKey } from "./nav";

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const paths: Record<PanelKey, React.ReactNode> = {
  // chat: a quiet speech mark, two lines of "voice"
  chat: (
    <>
      <path {...S} d="M4 5.5h12v8H8l-4 3.5z" />
      <path {...S} d="M7 8.5h6M7 11h4" />
    </>
  ),
  // graph: three nodes, two edges (the mind)
  graph: (
    <>
      <path {...S} d="M6 14.5l4-7M10 7.5l5 5" />
      <circle {...S} cx="5" cy="15.5" r="2" />
      <circle {...S} cx="10.5" cy="6" r="2" />
      <circle {...S} cx="15.5" cy="13" r="2" />
    </>
  ),
  // trade: two candles
  trade: (
    <>
      <path {...S} d="M7 4v3M7 13v3M13 5v2M13 12v3" />
      <rect {...S} x="5.5" y="7" width="3" height="6" rx="0.6" />
      <rect {...S} x="11.5" y="7.5" width="3" height="4.5" rx="0.6" />
    </>
  ),
  // settings: three sliders (not a cliché gear)
  settings: (
    <>
      <path {...S} d="M4 6.5h12M4 10h12M4 13.5h12" />
      <circle {...S} cx="8" cy="6.5" r="1.6" />
      <circle {...S} cx="13" cy="10" r="1.6" />
      <circle {...S} cx="7" cy="13.5" r="1.6" />
    </>
  ),
};

export function Glyph({ name, className = "" }: { name: PanelKey; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
