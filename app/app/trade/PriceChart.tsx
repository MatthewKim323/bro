"use client";

// live candlestick chart. real OHLC from GeckoTerminal, polled by the
// desk; the last candle is the one still forming and it ticks with the
// live price, so the right edge keeps moving the way dexscreener's
// does. drawn as wicks + bodies in the locked palette: up = accent
// (the system's forest green), down = soft (muted sage). no red, no
// neon, no gridlines, no axes, no chart library, zero deps. fills its
// container. the forming candle + a live dot animate (calm ease,
// reduced-motion honored globally). see BRO_PLAN.md §3 / §8.6.

import { motion } from "motion/react";
import type { Candle } from "@/lib/trading/ohlcv";

const W = 1000;
const H = 460;
const PAD = 12;
const EASE = [0.22, 1, 0.36, 1] as const;

const fmt = (v: number) =>
  v >= 1 ? "$" + v.toFixed(2) : "$" + v.toPrecision(3);

export function PriceChart({
  candles,
  loading,
}: {
  candles: Candle[];
  loading?: boolean;
}) {
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
  const lastI = n - 1;
  const last = candles[lastI];
  const lastCx = PAD + slot * (lastI + 0.5);
  const lastUp = last.c >= last.o;
  const lastColor = lastUp ? "var(--color-accent)" : "var(--color-soft)";

  return (
    <div className="relative h-full min-h-[260px] rounded-bro border border-line">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="live candlestick price history"
      >
        {candles.slice(0, lastI).map((c, i) => {
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

        {/* the forming candle: animates as the live price ticks it */}
        <motion.line
          x1={lastCx}
          x2={lastCx}
          stroke={lastColor}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          animate={{ y1: y(last.h), y2: y(last.l) }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        <motion.rect
          x={lastCx - bodyW / 2}
          width={bodyW}
          fill={lastColor}
          rx="0.5"
          animate={{
            y: Math.min(y(last.o), y(last.c)),
            height: Math.max(Math.abs(y(last.c) - y(last.o)), 1),
          }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        {/* live marker: a calm pulsing dot at the current price */}
        <motion.circle
          cx={lastCx}
          fill={lastColor}
          r="3"
          animate={{ cy: y(last.c) }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        <motion.circle
          cx={lastCx}
          fill="none"
          stroke={lastColor}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          animate={{ cy: y(last.c), r: [3, 11], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity }}
        />
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
