"use client";

// the paper desk (BRO_PLAN.md §8.6), revamped on the sleek-gradient
// system: the soft matcha field is this panel's hero backdrop, the
// equity is one big serif number, everything else is hairlines, tracked
// labels and a lot of negative space. one loud thing (buy, accent),
// the rest quiet. calm Reveal/Stagger motion. grain is already global.
//
// real Dexscreener prices + real GeckoTerminal charts, a simulated SOL
// wallet, fills through the pure guarded engine. "(sim)" / "paper" is
// always on screen because it never is real. no keypair, no RPC, no
// signature, no real funds.

import { useCallback, useEffect, useRef, useState } from "react";
import { MatchaField } from "@/app/components/MatchaField";
import { Reveal, Stagger } from "@/lib/motion";
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
  const [beat, setBeat] = useState(0);
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
        if (!aliveRef.current) return;
        setMovers(data);
        if (data.ok) setBeat((b) => b + 1);
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
  const moversOk = movers?.ok ?? false;
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
      {/* ── hero: the signature soft field, one big serif number ── */}
      <div className="relative shrink-0 overflow-hidden border-b border-line">
        <MatchaField variant="soft" />
        <Reveal className="relative z-10 px-10 py-11">
          <div className="flex flex-wrap items-end justify-between gap-10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  {moversOk && (
                    <span
                      key={beat}
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50"
                    />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      moversOk ? "bg-accent" : "bg-soft/50"
                    }`}
                  />
                </span>
                <span className="bro-label">paper wallet · sim</span>
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="bro-display text-6xl leading-none text-ink tabular-nums">
                  {fmtSol(wallet.equitySol, 2)}
                </span>
                <span className="text-base text-soft">SOL</span>
              </div>
              <div className="mt-2 text-sm text-soft tabular-nums">
                {fmtUsd(wallet.equityUsd)} · real price, paper fill, never
                your funds
              </div>
            </div>
            <div className="flex items-end gap-12">
              <Stat label="total pnl">
                <span className={upClass(wallet.totalPnlSol)}>
                  {fmtPct(wallet.totalPnlPct)}
                </span>
              </Stat>
              <Stat label="cash">
                {fmtSol(wallet.cashSol, 2)}
                <span className="text-soft"> SOL</span>
              </Stat>
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
        </Reveal>
      </div>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto px-10 py-9"
      >
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* ── movers: a quiet rail, accent marks the active one ── */}
          <div>
            <div className="bro-label mb-4">movers</div>
            <Stagger as="ul" className="flex flex-col">
              {tokens.map((t) => {
                const active = t.symbol === sel;
                return (
                  <Reveal as="li" key={t.symbol}>
                    <button
                      type="button"
                      onClick={() => setSel(t.symbol)}
                      className="group flex w-full items-center justify-between border-b border-line/60 py-3 pl-3 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`h-4 w-px transition-colors ${
                            active ? "bg-accent" : "bg-transparent"
                          }`}
                        />
                        <span
                          className={`bro-display text-base transition-colors ${
                            active
                              ? "text-ink"
                              : "text-soft group-hover:text-ink"
                          }`}
                        >
                          {t.symbol}
                        </span>
                      </span>
                      <span className="flex items-baseline gap-3">
                        <span className="tabular-nums text-[13px] text-ink">
                          {fmtPrice(t.priceUsd)}
                        </span>
                        <span
                          className={`w-12 text-right tabular-nums text-[12px] ${upClass(t.change24h)}`}
                        >
                          {fmtPct(t.change24h)}
                        </span>
                      </span>
                    </button>
                  </Reveal>
                );
              })}
              {tokens.length === 0 && (
                <li className="py-3 pl-3 text-sm text-soft">
                  reaching the market...
                </li>
              )}
            </Stagger>
          </div>

          {/* ── selected: the focal area, chart given air ── */}
          <div className="min-w-0">
            {selected ? (
              <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="bro-display text-3xl text-ink">
                        {selected.symbol}
                      </span>
                      <span className="text-sm text-soft">
                        {selected.name}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-5">
                      <span className="tabular-nums text-xl text-ink">
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
                  <div className="flex gap-5">
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

                <div className="mt-8">
                  <PriceChart candles={candles} loading={chartLoading} />
                </div>

                {/* ticket: one loud thing (buy), the rest quiet */}
                <div className="mt-8 rounded-bro border border-line p-6">
                  <div className="flex flex-wrap items-end gap-5">
                    <label className="flex flex-col gap-2">
                      <span className="bro-label">size · SOL (sim)</span>
                      <input
                        value={size}
                        onChange={(e) =>
                          setSize(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        inputMode="decimal"
                        className="w-36 rounded-bro border border-line bg-transparent px-3 py-2.5 text-lg text-ink tabular-nums outline-none transition-colors focus:border-soft"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onBuy}
                      className="rounded-bro bg-accent px-7 py-3 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
                    >
                      buy (paper)
                    </button>
                    <button
                      type="button"
                      disabled={!heldSel}
                      onClick={() =>
                        heldSel && onSell(selected, heldSel.tokens)
                      }
                      className="rounded-bro border border-line px-7 py-3 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      sell all (paper)
                    </button>
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-soft">
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
              </Reveal>
            ) : (
              <div className="flex h-full items-center justify-center text-soft">
                pick a mover to chart it.
              </div>
            )}
          </div>
        </div>

        {/* ── positions ── */}
        <Reveal className="mt-16">
          <div className="bro-label mb-5">positions</div>
          {wallet.positions.length === 0 ? (
            <div className="relative overflow-hidden rounded-bro border border-line">
              <MatchaField variant="soft" />
              <p className="relative z-10 px-8 py-12 text-center text-sm text-soft">
                no positions yet. bro is watching the movers. pick one, or
                ask bro to.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-bro border border-line">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th>token</Th>
                    <Th>holding</Th>
                    <Th>cost · SOL</Th>
                    <Th>value · SOL</Th>
                    <Th>pnl</Th>
                    <Th> </Th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.positions.map((p) => (
                    <tr
                      key={p.symbol}
                      className="border-b border-line/50 last:border-0"
                    >
                      <Td>
                        <span className="bro-display text-base text-ink">
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
        </Reveal>

        {/* ── history ── */}
        {ledger.fills.length > 0 && (
          <Reveal className="mt-16">
            <div className="bro-label mb-5">history</div>
            <ul className="flex flex-col">
              {[...ledger.fills].reverse().map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between border-b border-line/50 py-3 text-[13px] text-soft last:border-0"
                >
                  <span className="w-24">
                    <span
                      className={
                        f.side === "buy" ? "text-accent" : "text-ink"
                      }
                    >
                      {f.side}
                    </span>{" "}
                    <span className="bro-display text-ink">{f.symbol}</span>
                  </span>
                  <span className="flex-1 text-center tabular-nums">
                    {fmtTokens(f.tokens)} @ {fmtPrice(f.priceUsd)}
                  </span>
                  <span className="w-28 text-right tabular-nums text-ink">
                    {fmtSol(f.sol)} SOL
                  </span>
                  <span className="w-20 text-right tabular-nums">
                    {new Date(f.ts).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
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
      <div className="mt-1.5 text-lg tabular-nums text-ink">{children}</div>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="bro-label px-5 py-3 font-medium">{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-5 py-4 tabular-nums text-ink">{children}</td>
);
