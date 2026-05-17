"use client";

// the price chart. a custom in-palette SVG area curve, not a charting
// library: keeps it on-brand (tone over ornament, no gridlines, no
// axes) and adds zero dependencies. real OHLCV closes from
// GeckoTerminal, oldest -> newest. up vs down tints with the palette
// (accent vs soft), never red/green. one faint reference line at the
// open and tiny tracked low/high markers are the only "data" furniture,
// the expensive-restraint detail. see BRO_PLAN.md §3 / §8.6.

import { useId } from "react";
import type { Candle } from "@/lib/trading/ohlcv";

const W = 760;
const H = 300;
const PAD = 10;

const fmt = (v: number) =>
  v >= 1 ? "$" + v.toFixed(2) : "$" + v.toPrecision(3);

export function PriceChart({
  candles,
  loading,
}: {
  candles: Candle[];
  loading?: boolean;
}) {
  const gid = useId();

  if (loading || candles.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-bro border border-line">
        <span className="bro-label text-soft">
          {loading ? "drawing the chart..." : "no chart data yet"}
        </span>
      </div>
    );
  }

  const closes = candles.map((c) => c.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || max || 1;
  const open = closes[0];
  const up = closes[closes.length - 1] >= open;
  const stroke = up ? "var(--color-accent)" : "var(--color-soft)";

  const x = (i: number) => PAD + (i / (closes.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);

  const line = closes
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${x(closes.length - 1).toFixed(2)},${H} L${x(0).toFixed(2)},${H} Z`;
  const baseY = y(open).toFixed(2);

  return (
    <div className="relative rounded-bro border border-line p-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[300px] w-full"
        role="img"
        aria-label="price history"
      >
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* faint reference line at the window's open price */}
        <line
          x1={PAD}
          y1={baseY}
          x2={W - PAD}
          y2={baseY}
          stroke="var(--color-line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill={`url(#${gid}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={x(closes.length - 1)}
          cy={y(closes[closes.length - 1])}
          r="3"
          fill={stroke}
        />
      </svg>
      {/* tracked low/high, the only data furniture */}
      <span className="bro-label pointer-events-none absolute right-3 top-3 text-soft">
        {fmt(max)}
      </span>
      <span className="bro-label pointer-events-none absolute bottom-3 right-3 text-soft">
        {fmt(min)}
      </span>
    </div>
  );
}
