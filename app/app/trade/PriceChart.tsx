"use client";

// candlestick chart. real OHLC from GeckoTerminal, drawn as wicks +
// bodies like a pump.fun-style desk, but in the locked palette: up =
// accent (the system's forest green), down = soft (muted sage). no
// red, no neon, no gridlines, no axes, no chart library, zero deps.
// fills its container. see BRO_PLAN.md §3 / §8.6.

import { useId } from "react";
import type { Candle } from "@/lib/trading/ohlcv";

const W = 1000;
const H = 460;
const PAD = 12;

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
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-bro border border-line">
        <span className="bro-label text-soft">
          {loading ? "drawing the chart..." : "no chart data yet"}
        </span>
      </div>
    );
  }

  const hi = Math.max(...candles.map((c) => c.h));
  const lo = Math.min(...candles.map((c) => c.l));
  const span = hi - lo || hi || 1;
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2);

  const n = candles.length;
  const slot = (W - PAD * 2) / n;
  const bodyW = Math.max(1, Math.min(slot * 0.64, 13));

  return (
    <div className="relative h-full min-h-[260px] rounded-bro border border-line">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="candlestick price history"
        aria-describedby={`${gid}-d`}
      >
        <desc id={`${gid}-d`}>
          {n} candles, {fmt(lo)} to {fmt(hi)}
        </desc>
        {candles.map((c, i) => {
          const cx = PAD + slot * (i + 0.5);
          const up = c.c >= c.o;
          const color = up ? "var(--color-accent)" : "var(--color-soft)";
          const yo = y(c.o);
          const yc = y(c.c);
          const top = Math.min(yo, yc);
          const h = Math.max(Math.abs(yc - yo), 1);
          return (
            <g key={c.t}>
              <line
                x1={cx}
                y1={y(c.h)}
                x2={cx}
                y2={y(c.l)}
                stroke={color}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={cx - bodyW / 2}
                y={top}
                width={bodyW}
                height={h}
                fill={color}
                rx="0.5"
              />
            </g>
          );
        })}
      </svg>
      <span className="bro-label pointer-events-none absolute right-3 top-3 text-soft">
        {fmt(hi)}
      </span>
      <span className="bro-label pointer-events-none absolute bottom-3 right-3 text-soft">
        {fmt(lo)}
      </span>
    </div>
  );
}
