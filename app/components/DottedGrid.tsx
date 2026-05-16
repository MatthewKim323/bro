// a faint dotted-grid micro-detail. seasoning, not wallpaper: use it
// exactly once per screen, in a corner, masked so it fades out.
// see BRO_PLAN.md §3.3.

type Corner = "tl" | "tr" | "bl" | "br";

type DottedGridProps = {
  corner?: Corner;
  /** square edge length of the patch */
  size?: number;
  className?: string;
};

// gentle fade: dots stay crisp through ~45% of the patch, then ease out
const fadeByCorner: Record<Corner, string> = {
  tl: "radial-gradient(125% 125% at 0% 0%, #000 0%, #000 45%, transparent 100%)",
  tr: "radial-gradient(125% 125% at 100% 0%, #000 0%, #000 45%, transparent 100%)",
  bl: "radial-gradient(125% 125% at 0% 100%, #000 0%, #000 45%, transparent 100%)",
  br: "radial-gradient(125% 125% at 100% 100%, #000 0%, #000 45%, transparent 100%)",
};

// inset from the edge so it reads as a deliberate detail, not bleed
const posByCorner: Record<Corner, React.CSSProperties> = {
  tl: { top: 56, left: 56 },
  tr: { top: 56, right: 56 },
  bl: { bottom: 56, left: 56 },
  br: { bottom: 56, right: 56 },
};

export function DottedGrid({
  corner = "tr",
  size = 150,
  className = "",
}: DottedGridProps) {
  const mask = fadeByCorner[corner];
  return (
    <div
      aria-hidden
      className={`bro-dots ${className}`}
      style={{
        width: size,
        height: size,
        ...posByCorner[corner],
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}
