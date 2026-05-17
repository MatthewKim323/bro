"use client";

// the paper desk (BRO_PLAN.md §8.6), pump.fun-minimal: search any coin,
// a big candlestick chart, buy/sell. nothing else on screen. your money
// lives in a collapsed bar at the bottom, tap it and the wallet +
// positions rise up. progressive disclosure: the 20% you need, the rest
// one tap away.
//
// real Dexscreener prices + real GeckoTerminal candles, a simulated SOL
// wallet, fills through the pure guarded engine. "(sim)" stays visible
// in the tray. no keypair, no RPC, no signature, no real funds.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatchaField } from "@/app/components/MatchaField";
import type { Candle } from "@/lib/trading/ohlcv";
import {
  WATCHLIST,
  type Mover,
  type Movers,
} from "@/lib/trading/discovery";
import {
  walletState,
  PER_TRADE_MAX_SOL,
  DAILY_MAX_SOL,
} from "@/lib/trading/engine";
import { useLocalJSON } from "@/app/app/_shell/useLocalStore";
import { useLedger } from "./useLedger";
import { PriceChart } from "./PriceChart";

type TF = "1h" | "1d";
const WATCH_MINTS = new Set(WATCHLIST.map((w) => w.mint));

const fmtPrice = (p: number | null) => {
  if (p == null) return "...";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toPrecision(3);
};
const fmtSol = (n: number | null, d = 2) => (n == null ? "..." : n.toFixed(d));
const fmtUsd = (n: number | null) =>
  n == null ? "..." : "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtPct = (n: number | null) =>
  n == null ? "" : (n > 0 ? "+" : "") + n.toFixed(1) + "%";
const fmtTokens = (n: number) =>
  n >= 1e6
    ? (n / 1e6).toFixed(2) + "M"
    : n >= 1e3
      ? (n / 1e3).toFixed(2) + "k"
      : n.toFixed(2);
const upClass = (n: number | null) =>
  n == null ? "text-soft" : n >= 0 ? "text-accent" : "text-soft";

export function TradeDesk() {
  const [movers, setMovers] = useState<Movers | null>(null);
  const [sel, setSel] = useState<string>("OPAL");
  const [tf, setTf] = useState<TF>("1h");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [size, setSize] = useState("1");
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [walletOpen, setWalletOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; items: Mover[] }>({
    q: "",
    items: [],
  });

  const { ledger, buy, sell, reset } = useLedger();
  // coins you searched into; kept live-priced alongside the watchlist
  // and anything you hold, so a non-watchlist position still has a
  // price, a chart and a PnL. persists across reloads.
  const [extraMints, setExtraMints] = useLocalJSON<string[]>(
    "bro.trade.extra.v1",
    [],
  );
  const aliveRef = useRef(true);

  // every mint the poll must price: searched-into + currently held
  const pollExtra = useMemo(() => {
    const held = ledger.fills.map((f) => f.mint);
    return Array.from(new Set([...extraMints, ...held])).filter(
      (m) => !WATCH_MINTS.has(m),
    );
  }, [extraMints, ledger.fills]);
  const pollKey = pollExtra.join(",");

  // re-subscribed only when the priced set changes (a rare event:
  // searching into or first holding a non-watchlist coin).
  useEffect(() => {
    aliveRef.current = true;
    async function tick() {
      try {
        const res = await fetch(
          `/api/trade/movers${pollKey ? `?extra=${encodeURIComponent(pollKey)}` : ""}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as Movers;
        if (aliveRef.current) setMovers(data);
      } catch {
        /* keep last good */
      }
    }
    tick();
    const id = setInterval(tick, 20_000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [pollKey]);

  // open search, debounced. setState only after the await (never
  // synchronously in the effect body).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/trade/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" },
        );
        const d = (await res.json()) as { tokens?: Mover[] };
        if (alive) setResults({ q, items: d.tokens ?? [] });
      } catch {
        if (alive) setResults({ q, items: [] });
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const tokens = movers?.tokens ?? [];
  const solUsd = movers?.solUsd ?? null;
  const searching = query.trim().length >= 2;
  const list = searching && results.q === query.trim() ? results.items : tokens;

  // selected resolves from the live poll first, else the just-searched
  // result (so a freshly picked coin charts instantly, before the next
  // poll folds it into the priced set).
  const selected: Mover | null =
    tokens.find((t) => t.symbol === sel) ??
    results.items.find((t) => t.symbol === sel) ??
    null;
  const pool = selected?.pool ?? null;
  const chartKey = pool ? `${pool}:${tf}` : null;
  const chartLoading = chartKey != null && loadedKey !== chartKey;

  useEffect(() => {
    if (!chartKey || !pool) return;
    let alive = true;
    async function load(key: string, p: string) {
      let next: Candle[] = [];
      try {
        const res = await fetch(
          `/api/trade/ohlcv?pool=${encodeURIComponent(p)}&tf=${tf}`,
          { cache: "no-store" },
        );
        const d = (await res.json()) as { candles?: Candle[] };
        next = d.candles ?? [];
      } catch {
        next = [];
      }
      if (!alive) return;
      setCandles(next);
      setLoadedKey(key);
    }
    load(chartKey, pool);
    return () => {
      alive = false;
    };
  }, [chartKey, pool, tf]);

  const wallet = walletState(ledger, tokens, solUsd);
  const heldSel = wallet.positions.find((p) => p.symbol === sel);

  const pick = useCallback(
    (m: Mover) => {
      setSel(m.symbol);
      setQuery("");
      if (!WATCH_MINTS.has(m.mint)) {
        setExtraMints((prev) =>
          prev.includes(m.mint) ? prev : [...prev, m.mint],
        );
      }
    },
    [setExtraMints],
  );

  const onBuy = useCallback(() => {
    if (!selected) return;
    const r = buy(selected, Number(size), solUsd);
    setNotice(
      r.ok
        ? { ok: true, msg: `bought ${selected.symbol} · ${Number(size)} SOL` }
        : { ok: false, msg: r.reason },
    );
  }, [selected, size, solUsd, buy]);

  const onSell = useCallback(
    (mover: Mover, tokensAmt: number) => {
      const r = sell(mover, tokensAmt, solUsd);
      setNotice(
        r.ok
          ? { ok: true, msg: `closed ${mover.symbol}` }
          : { ok: false, msg: r.reason },
      );
    },
    [sell, solUsd],
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col px-8 pb-[60px] pt-6">
        {/* search any coin */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search any memecoin..."
          className="w-full max-w-sm rounded-bro border border-line bg-transparent px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-soft focus:border-soft"
        />

        {/* coin row: search results while searching, else watchlist */}
        <div className="mt-3 flex items-center gap-1 overflow-x-auto">
          {list.map((t) => {
            const active = t.symbol === sel;
            return (
              <button
                key={t.mint}
                type="button"
                onClick={() => pick(t)}
                className={`flex shrink-0 items-baseline gap-2 rounded-bro px-3.5 py-2 transition-colors ${
                  active ? "bg-surface" : "hover:bg-surface/50"
                }`}
              >
                <span
                  className={`bro-display text-base ${active ? "text-ink" : "text-soft"}`}
                >
                  {t.symbol}
                </span>
                <span className={`text-[11px] tabular-nums ${upClass(t.change24h)}`}>
                  {fmtPct(t.change24h)}
                </span>
              </button>
            );
          })}
          {list.length === 0 && (
            <span className="px-3 py-2 text-sm text-soft">
              {searching ? "no coins match that." : "reaching the market..."}
            </span>
          )}
        </div>

        {selected && (
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-4">
              <span className="bro-display text-3xl text-ink">
                {selected.symbol}
              </span>
              <span className="tabular-nums text-xl text-ink">
                {fmtPrice(selected.priceUsd)}
              </span>
              <span
                className={`tabular-nums text-sm ${upClass(selected.change24h)}`}
              >
                {fmtPct(selected.change24h)}
              </span>
            </div>
            <div className="flex gap-4">
              {(["1h", "1d"] as TF[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTf(f)}
                  className={`pb-1 text-[12px] uppercase tracking-[0.16em] transition-colors ${
                    tf === f
                      ? "border-b border-accent text-ink"
                      : "border-b border-transparent text-soft hover:text-ink"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* the candlestick chart, big */}
        <div className="mt-4 min-h-0 flex-1">
          <PriceChart candles={candles} loading={chartLoading} />
        </div>

        {/* buy / sell, one row */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-bro border border-line">
            <input
              value={size}
              onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              aria-label="size in SOL"
              className="w-24 bg-transparent px-3 py-3 text-base text-ink tabular-nums outline-none"
            />
            <span className="pr-3 text-[12px] text-soft">SOL</span>
          </div>
          <button
            type="button"
            onClick={onBuy}
            className="rounded-bro bg-accent px-8 py-3 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
          >
            buy
          </button>
          <button
            type="button"
            disabled={!heldSel}
            onClick={() => selected && heldSel && onSell(selected, heldSel.tokens)}
            className="rounded-bro border border-line px-8 py-3 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            sell
          </button>
          {notice && (
            <span
              className={`text-[13px] ${notice.ok ? "text-soft" : "text-ink"}`}
            >
              {notice.msg}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {walletOpen && (
          <motion.button
            type="button"
            aria-label="close wallet"
            onClick={() => setWalletOpen(false)}
            className="absolute inset-0 z-10 bg-ink/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* the pump.fun-style wallet tray */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <AnimatePresence>
          {walletOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[62vh] overflow-y-auto border-t border-line"
              data-lenis-prevent
            >
              <MatchaField variant="soft" />
              <div className="relative z-10 px-8 py-7">
                <div className="flex flex-wrap items-end gap-x-12 gap-y-4">
                  <div>
                    <div className="bro-label">balance · sim</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="bro-display text-4xl text-ink tabular-nums">
                        {fmtSol(wallet.equitySol)}
                      </span>
                      <span className="text-sm text-soft">SOL</span>
                      <span className="ml-1 text-sm text-soft tabular-nums">
                        {fmtUsd(wallet.equityUsd)}
                      </span>
                    </div>
                  </div>
                  <Stat label="pnl">
                    <span className={upClass(wallet.totalPnlSol)}>
                      {fmtPct(wallet.totalPnlPct)}
                    </span>
                  </Stat>
                  <Stat label="cash">{fmtSol(wallet.cashSol)} SOL</Stat>
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setNotice({ ok: true, msg: "reset to seed" });
                    }}
                    className="ml-auto text-[12px] text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                  >
                    reset
                  </button>
                </div>

                <div className="bro-label mt-8 mb-3">positions</div>
                {wallet.positions.length === 0 ? (
                  <p className="py-4 text-sm text-soft">
                    nothing open. pick a coin and buy.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {wallet.positions.map((p) => (
                      <li
                        key={p.symbol}
                        className="flex items-center justify-between border-b border-line/50 py-3 text-[14px] last:border-0"
                      >
                        <span className="bro-display w-20 text-ink">
                          {p.symbol}
                        </span>
                        <span className="flex-1 tabular-nums text-soft">
                          {fmtTokens(p.tokens)}
                        </span>
                        <span className="w-24 text-right tabular-nums text-ink">
                          {fmtSol(p.valueSol)} SOL
                        </span>
                        <span
                          className={`w-16 text-right tabular-nums ${upClass(p.pnlSol)}`}
                        >
                          {fmtPct(p.pnlPct)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const mv = tokens.find(
                              (t) => t.symbol === p.symbol,
                            );
                            if (mv) onSell(mv, p.tokens);
                          }}
                          className="w-14 text-right text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                        >
                          close
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-6 text-[11px] text-soft">
                  paper · max {PER_TRADE_MAX_SOL} SOL/trade ·{" "}
                  {DAILY_MAX_SOL}/day · 0.5% sim slippage · real price,
                  never your funds
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setWalletOpen((o) => !o)}
          className="relative flex h-[60px] w-full items-center justify-between border-t border-line bg-bg px-8 transition-colors hover:bg-surface/40"
        >
          <span className="flex items-baseline gap-3">
            <span className="bro-display text-xl text-ink tabular-nums">
              {fmtSol(wallet.equitySol)}
            </span>
            <span className="text-sm text-soft">SOL</span>
            <span
              className={`text-sm tabular-nums ${upClass(wallet.totalPnlSol)}`}
            >
              {fmtPct(wallet.totalPnlPct)}
            </span>
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden
            className={`text-soft transition-transform duration-300 ${
              walletOpen ? "rotate-180" : ""
            }`}
          >
            <path
              d="M3 5l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="bro-label">{label}</div>
      <div className="mt-1.5 text-lg tabular-nums text-ink">{children}</div>
    </div>
  );
}
