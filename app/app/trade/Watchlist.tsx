"use client";

// the movers bro watches: real live prices for well-known Solana tokens
// (Dexscreener public API, no key, no wallet). prices are real; the fill
// engine is paper and lands in phase 6. see BRO_PLAN.md §8.6 / §10.
// this renders inside a Panel, so no outer container of its own.

import { useEffect, useState } from "react";
import { motion } from "motion/react";

type WatchToken = {
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24h: number | null;
  volumeUsd: number | null;
};

function fmtPrice(p: number | null): string {
  if (p == null) return "...";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toPrecision(3);
}

function change(c: number | null) {
  if (c == null) return { txt: "...", cls: "text-soft", glyph: "" };
  const up = c > 0;
  return {
    txt: (up ? "+" : "") + c.toFixed(1) + "%",
    cls: up ? "text-accent" : "text-soft",
    glyph: up ? "▲" : c < 0 ? "▼" : "",
  };
}

export function Watchlist() {
  const [tokens, setTokens] = useState<WatchToken[] | null>(null);
  const [ok, setOk] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/solana/watchlist", {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          ok: boolean;
          tokens: WatchToken[];
        };
        if (!alive) return;
        setTokens(data.tokens);
        setOk(data.ok);
        if (data.ok) setBeat((b) => b + 1);
      } catch {
        /* keep last good value */
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const rows = tokens ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span
            className={`h-2 w-2 rounded-full ${ok ? "bg-accent" : "bg-soft/50"}`}
          />
          {ok && (
            <motion.span
              key={beat}
              className="absolute inset-0 rounded-full border border-accent"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </span>
        <span className="text-sm text-soft">
          {ok
            ? "real prices via dexscreener. paper only, never your funds."
            : "reaching solana..."}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="bro-label text-soft">token</span>
        <div className="flex items-center gap-12">
          <span className="bro-label hidden text-soft sm:inline">price</span>
          <span className="bro-label w-16 text-right text-soft">24h</span>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {rows.map((t) => {
          const c = change(t.change24h);
          return (
            <li
              key={t.symbol}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-baseline gap-3">
                <span className="bro-display text-lg text-ink">
                  {t.symbol}
                </span>
                <span className="text-sm text-soft">{t.name}</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="tabular-nums text-ink">
                  {fmtPrice(t.priceUsd)}
                </span>
                <span
                  className={`flex w-16 items-center justify-end gap-1 tabular-nums ${c.cls}`}
                >
                  <span className="text-[10px]">{c.glyph}</span>
                  {c.txt}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
