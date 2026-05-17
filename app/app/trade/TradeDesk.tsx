"use client";

// the paper desk (BRO_PLAN.md §8.6). real Dexscreener prices + real
// GeckoTerminal charts, a simulated SOL wallet, fills run through the
// pure guarded engine. the word "(sim)" / "paper" is always on screen:
// you can never mistake this for real money, because it never is. no
// keypair, no RPC, no signature, no real funds.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/trading/ohlcv";
import type { Mover, Movers } from "@/lib/trading/discovery";
import {
  walletState,
  PER_TRADE_MAX_SOL,
  DAILY_MAX_SOL,
} from "@/lib/trading/engine";
import { useLedger } from "./useLedger";
import { PriceChart } from "./PriceChart";

type TF = "1h" | "1d";

const fmtPrice = (p: number | null) => {
  if (p == null) return "...";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toPrecision(3);
};
const fmtSol = (n: number | null, d = 3) =>
  n == null ? "..." : n.toFixed(d);
const fmtUsd = (n: number | null) =>
  n == null
    ? "..."
    : "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtPct = (n: number | null) =>
  n == null ? "..." : (n > 0 ? "+" : "") + n.toFixed(1) + "%";
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
  // loading is DERIVED (loaded key vs wanted key), so nothing setStates
  // synchronously inside the chart effect.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [size, setSize] = useState("1");
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const { ledger, buy, sell, reset } = useLedger();
  const aliveRef = useRef(true);

  // poll the movers on a calm cadence (the lib also caches server-side)
  useEffect(() => {
    aliveRef.current = true;
    async function tick() {
      try {
        const res = await fetch("/api/trade/movers", { cache: "no-store" });
        const data = (await res.json()) as Movers;
        if (aliveRef.current) setMovers(data);
      } catch {
        /* keep last good */
      }
    }
    tick();
    const id = setInterval(tick, 25_000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, []);

  const tokens = movers?.tokens ?? [];
  const solUsd = movers?.solUsd ?? null;
  const selected: Mover | null = tokens.find((t) => t.symbol === sel) ?? null;
  const pool = selected?.pool ?? null;
  const chartKey = pool ? `${pool}:${tf}` : null;
  const chartLoading = chartKey != null && loadedKey !== chartKey;

  // load the real chart whenever the selected pool or timeframe changes.
  // every setState here happens AFTER an await (never synchronously in
  // the effect body), and "loading" is derived above, not set here.
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

  const onBuy = useCallback(() => {
    if (!selected) return;
    const r = buy(selected, Number(size), solUsd);
    setNotice(
      r.ok
        ? { ok: true, msg: `bought ${selected.symbol} with ${Number(size)} SOL (sim).` }
        : { ok: false, msg: r.reason },
    );
  }, [selected, size, solUsd, buy]);

  const onSell = useCallback(
    (mover: Mover, tokensAmt: number) => {
      const r = sell(mover, tokensAmt, solUsd);
      setNotice(
        r.ok
          ? { ok: true, msg: `closed ${mover.symbol} (sim).` }
          : { ok: false, msg: r.reason },
      );
    },
    [sell, solUsd],
  );

  return (
    <div className="flex h-full flex-col">
      {/* wallet band */}
      <div className="shrink-0 border-b border-line px-8 py-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="bro-label">paper wallet · sim</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="bro-display text-4xl text-ink">
                {fmtSol(wallet.equitySol, 2)}
              </span>
              <span className="text-sm text-soft">SOL</span>
              <span className="ml-2 text-sm text-soft">
                {fmtUsd(wallet.equityUsd)}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-10">
            <Stat label="total pnl">
              <span className={upClass(wallet.totalPnlSol)}>
                {fmtPct(wallet.totalPnlPct)}
              </span>
            </Stat>
            <Stat label="cash">{fmtSol(wallet.cashSol, 2)} SOL</Stat>
            <Stat label="positions">{wallet.positions.length}</Stat>
            <button
              type="button"
              onClick={() => {
                reset();
                setNotice({ ok: true, msg: "sim wallet reset to seed." });
              }}
              className="text-[12px] text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              reset
            </button>
          </div>
        </div>
      </div>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto px-8 py-6"
      >
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* movers */}
          <div>
            <div className="bro-label mb-3">movers</div>
            <ul className="flex flex-col">
              {tokens.map((t) => {
                const active = t.symbol === sel;
                return (
                  <li key={t.symbol}>
                    <button
                      type="button"
                      onClick={() => setSel(t.symbol)}
                      className={`flex w-full items-center justify-between rounded-bro px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-surface" : "hover:bg-surface/50"
                      }`}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="bro-display text-base text-ink">
                          {t.symbol}
                        </span>
                      </span>
                      <span className="flex items-baseline gap-3">
                        <span className="tabular-nums text-[13px] text-ink">
                          {fmtPrice(t.priceUsd)}
                        </span>
                        <span
                          className={`w-14 text-right tabular-nums text-[12px] ${upClass(t.change24h)}`}
                        >
                          {fmtPct(t.change24h)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {tokens.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-soft">
                  reaching the market...
                </li>
              )}
            </ul>
          </div>

          {/* selected token: chart + ticket */}
          <div className="min-w-0">
            {selected ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="bro-display text-2xl text-ink">
                        {selected.symbol}
                      </span>
                      <span className="text-sm text-soft">
                        {selected.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-4">
                      <span className="tabular-nums text-lg text-ink">
                        {fmtPrice(selected.priceUsd)}
                      </span>
                      <span
                        className={`tabular-nums text-sm ${upClass(selected.change24h)}`}
                      >
                        {fmtPct(selected.change24h)} 24h
                      </span>
                      <span className="text-sm text-soft">
                        liq{" "}
                        {selected.liquidityUsd
                          ? fmtUsd(selected.liquidityUsd)
                          : "..."}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(["1h", "1d"] as TF[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTf(f)}
                        className={`rounded-bro px-3 py-1 text-[12px] transition-colors ${
                          tf === f
                            ? "bg-surface text-ink"
                            : "text-soft hover:text-ink"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <PriceChart candles={candles} loading={chartLoading} />
                </div>

                {/* ticket */}
                <div className="mt-6 rounded-bro border border-line p-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="bro-label">size · SOL (sim)</span>
                      <input
                        value={size}
                        onChange={(e) =>
                          setSize(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        inputMode="decimal"
                        className="w-32 rounded-bro border border-line bg-transparent px-3 py-2 text-ink outline-none focus:border-soft"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onBuy}
                      className="rounded-bro bg-accent px-6 py-2.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
                    >
                      buy (paper)
                    </button>
                    <button
                      type="button"
                      disabled={!heldSel}
                      onClick={() =>
                        heldSel && onSell(selected, heldSel.tokens)
                      }
                      className="rounded-bro border border-line px-6 py-2.5 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      sell all (paper)
                    </button>
                  </div>
                  <p className="mt-3 text-[12px] text-soft">
                    guardrail: max {PER_TRADE_MAX_SOL} SOL / trade ·{" "}
                    {DAILY_MAX_SOL} SOL / day · 0.5% sim slippage. real
                    price, paper fill, never your funds.
                  </p>
                  {notice && (
                    <p
                      className={`mt-3 text-[13px] ${
                        notice.ok ? "text-ink" : "text-soft"
                      }`}
                    >
                      {notice.msg}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-soft">
                pick a mover to chart it.
              </div>
            )}
          </div>
        </div>

        {/* positions */}
        <div className="mt-10">
          <div className="bro-label mb-3">positions</div>
          {wallet.positions.length === 0 ? (
            <p className="text-sm text-soft">
              no positions yet. bro is watching the movers. pick one, or
              ask bro to.
            </p>
          ) : (
            <div className="overflow-hidden rounded-bro border border-line">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-soft">
                    <Th>token</Th>
                    <Th>holding</Th>
                    <Th>cost (SOL)</Th>
                    <Th>value (SOL)</Th>
                    <Th>pnl</Th>
                    <Th> </Th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.positions.map((p) => (
                    <tr key={p.symbol} className="border-b border-line/60">
                      <Td>
                        <span className="bro-display text-ink">
                          {p.symbol}
                        </span>
                      </Td>
                      <Td>{fmtTokens(p.tokens)}</Td>
                      <Td>{fmtSol(p.costSol)}</Td>
                      <Td>{fmtSol(p.valueSol)}</Td>
                      <Td>
                        <span className={upClass(p.pnlSol)}>
                          {fmtPct(p.pnlPct)}
                        </span>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => {
                            const mv = tokens.find(
                              (t) => t.symbol === p.symbol,
                            );
                            if (mv) onSell(mv, p.tokens);
                          }}
                          className="text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                        >
                          close
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* history */}
        {ledger.fills.length > 0 && (
          <div className="mt-10">
            <div className="bro-label mb-3">history</div>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {[...ledger.fills].reverse().map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between border-b border-line/50 py-1.5 text-soft"
                >
                  <span>
                    <span className={f.side === "buy" ? "text-accent" : "text-ink"}>
                      {f.side}
                    </span>{" "}
                    <span className="text-ink">{f.symbol}</span>
                  </span>
                  <span className="tabular-nums">
                    {fmtTokens(f.tokens)} @ {fmtPrice(f.priceUsd)}
                  </span>
                  <span className="tabular-nums">{fmtSol(f.sol)} SOL</span>
                  <span>
                    {new Date(f.ts).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
      <div className="mt-1 tabular-nums text-ink">{children}</div>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="bro-label px-4 py-2.5 font-medium">{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 tabular-nums text-ink">{children}</td>
);
