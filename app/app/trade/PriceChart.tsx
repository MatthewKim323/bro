"use client";

// a genuine candlestick chart: real OHLC from GeckoTerminal with a
// price axis (right, like dexscreener), a time axis, gridlines, a live
// last-price tag, and a volume strip. measured to its container so
// nothing is stretched. polled by the desk; the last candle is the one
// still forming and ticks with the live price. palette only: up =
// accent, down = soft, grid = line, axis text = soft. zero deps.

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Candle } from "@/lib/trading/ohlcv";

const EASE = [0.22, 1, 0.36, 1] as const;
const MR = 64; // right gutter: price axis
const MB = 26; // bottom gutter: time axis
const MT = 10;
const ML = 10;

function price(v: number) {
  if (v >= 1) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 0.01) return "$" + v.toFixed(4);
  if (v >= 0.00001) return "$" + v.toFixed(6);
  return "$" + v.toExponential(2);
}

// "nice" axis ticks across [min,max]
function ticks(min: number, max: number, count: number): number[] {
  const span = max - min || max || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step =
    (norm >= 5 ? 5 : norm >= 2 ? 2 : norm >= 1 ? 1 : 0.5) * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + 1e-12; v += step) out.push(v);
  return out;
}

function timeLabel(ts: number, tf: string) {
  const d = new Date(ts * 1000);
  if (tf === "1d")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function PriceChart({
  candles,
  loading,
  tf = "1m",
}: {
  candles: Candle[];
  loading?: boolean;
  tf?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = box.w > 40 && box.h > 40 && candles.length >= 2;

  return (
    <div
      ref={boxRef}
      className="relative h-full min-h-[280px] w-full rounded-bro border border-line"
    >
      {!ready ? (
        <div className="flex h-full items-center justify-center">
          <span className="bro-label text-soft">
            {loading || candles.length < 2
              ? "drawing the chart..."
              : "no chart data yet"}
          </span>
        </div>
      ) : (
        <Plot candles={candles} tf={tf} w={box.w} h={box.h} />
      )}
    </div>
  );
}

function Plot({
  candles,
  tf,
  w,
  h,
}: {
  candles: Candle[];
  tf: string;
  w: number;
  h: number;
}) {
  const x0 = ML;
  const x1 = w - MR;
  const plotW = Math.max(1, x1 - x0);
  const yTop = MT;
  const yBot = h - MB;
  const priceH = (yBot - yTop) * 0.76;
  const volTop = yTop + priceH + 6;
  const volBot = yBot;

  const hi = Math.max(...candles.map((c) => c.h));
  const lo = Math.min(...candles.map((c) => c.l));
  const padSpan = (hi - lo || hi || 1) * 0.08;
  const pMax = hi + padSpan;
  const pMin = Math.max(0, lo - padSpan);
  const pSpan = pMax - pMin || 1;
  const y = (v: number) => yTop + (1 - (v - pMin) / pSpan) * priceH;

  const vMax = Math.max(...candles.map((c) => c.v), 1);
  const vY = (v: number) => volBot - (v / vMax) * (volBot - volTop);

  const n = candles.length;
  const slot = plotW / n;
  const bodyW = Math.max(1, Math.min(slot * 0.62, 12));
  const cx = (i: number) => x0 + slot * (i + 0.5);

  const lastI = n - 1;
  const last = candles[lastI];
  const lastUp = last.c >= last.o;
  const lastColor = lastUp ? "var(--color-accent)" : "var(--color-soft)";
  const lastY = y(last.c);

  const priceTicks = ticks(pMin, pMax, 5).filter(
    (v) => y(v) > yTop + 4 && y(v) < yTop + priceH - 2,
  );
  const timeIdx = Array.from({ length: 5 }, (_, k) =>
    Math.round((k / 4) * (n - 1)),
  ).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block"
      role="img"
      aria-label="live candlestick chart"
    >
      {/* horizontal grid + price axis (right) */}
      {priceTicks.map((v) => {
        const yy = y(v);
        return (
          <g key={`p${v}`}>
            <line
              x1={x0}
              y1={yy}
              x2={x1}
              y2={yy}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={x1 + 6}
              y={yy + 3}
              fontSize="10"
              fill="var(--color-soft)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {price(v)}
            </text>
          </g>
        );
      })}

      {/* time axis */}
      {timeIdx.map((i) => (
        <g key={`t${i}`}>
          <line
            x1={cx(i)}
            y1={yTop}
            x2={cx(i)}
            y2={yBot}
            stroke="var(--color-line)"
            strokeWidth="1"
            opacity="0.5"
          />
          <text
            x={cx(i)}
            y={h - 9}
            fontSize="10"
            fill="var(--color-soft)"
            textAnchor="middle"
          >
            {timeLabel(candles[i].t, tf)}
          </text>
        </g>
      ))}

      {/* volume strip */}
      {candles.map((c, i) => (
        <rect
          key={`v${c.t}`}
          x={cx(i) - bodyW / 2}
          y={vY(c.v)}
          width={bodyW}
          height={Math.max(0, volBot - vY(c.v))}
          fill={c.c >= c.o ? "var(--color-accent)" : "var(--color-soft)"}
          opacity="0.18"
        />
      ))}

      {/* candles (the forming one is animated) */}
      {candles.slice(0, lastI).map((c, i) => {
        const up = c.c >= c.o;
        const color = up ? "var(--color-accent)" : "var(--color-soft)";
        const top = Math.min(y(c.o), y(c.c));
        const bh = Math.max(Math.abs(y(c.c) - y(c.o)), 1);
        return (
          <g key={c.t}>
            <line
              x1={cx(i)}
              y1={y(c.h)}
              x2={cx(i)}
              y2={y(c.l)}
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x={cx(i) - bodyW / 2}
              y={top}
              width={bodyW}
              height={bh}
              fill={color}
              rx="0.5"
            />
          </g>
        );
      })}
      <motion.line
        x1={cx(lastI)}
        x2={cx(lastI)}
        stroke={lastColor}
        strokeWidth="1"
        animate={{ y1: y(last.h), y2: y(last.l) }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      <motion.rect
        x={cx(lastI) - bodyW / 2}
        width={bodyW}
        fill={lastColor}
        rx="0.5"
        animate={{
          y: Math.min(y(last.o), y(last.c)),
          height: Math.max(Math.abs(y(last.c) - y(last.o)), 1),
        }}
        transition={{ duration: 0.5, ease: EASE }}
      />

      {/* live last-price line + tag, the dexscreener current marker */}
      <motion.line
        x1={x0}
        x2={x1}
        stroke={lastColor}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.7"
        animate={{ y1: lastY, y2: lastY }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      <motion.g
        animate={{ y: lastY }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <rect
          x={x1 + 1}
          y={-9}
          width={MR - 2}
          height={18}
          rx="3"
          fill={lastColor}
        />
        <text
          x={x1 + MR / 2}
          y={4}
          fontSize="10"
          fill="var(--color-bg)"
          textAnchor="middle"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {price(last.c)}
        </text>
      </motion.g>
      <motion.circle
        cx={cx(lastI)}
        fill="none"
        stroke={lastColor}
        strokeWidth="1"
        animate={{ cy: lastY, r: [3, 12], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity }}
      />
    </svg>
  );
}
