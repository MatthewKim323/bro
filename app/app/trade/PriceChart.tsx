"use client";

// the price chart. a custom in-palette SVG area curve, not a charting
// library: keeps it on-brand (no chart junk, no gridlines, tone over
// ornament) and adds zero dependencies. real OHLCV close prices from
// GeckoTerminal, oldest -> newest. up vs down tints with the palette
// (accent vs soft), never red/green. see BRO_PLAN.md §3 / §8.6.

import { useId } from "react";
import type { Candle } from "@/lib/trading/ohlcv";

const W = 760;
const H = 240;
const PAD = 8;

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
      <div className="flex h-[240px] items-center justify-center rounded-bro border border-line">
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
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "var(--color-accent)" : "var(--color-soft)";

  const x = (i: number) =>
    PAD + (i / (closes.length - 1)) * (W - PAD * 2);
  const y = (v: number) =>
    PAD + (1 - (v - min) / span) * (H - PAD * 2);

  const line = closes
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${x(closes.length - 1).toFixed(2)},${H} L${x(0).toFixed(2)},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[240px] w-full"
      role="img"
      aria-label="price history"
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
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
  );
}
