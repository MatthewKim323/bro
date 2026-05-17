// the paper engine. PURE: no React, no storage, no network. it takes a
// ledger + the live movers and returns derived wallet state, or appends
// a guarded fill. every number here is simulated. there is no keypair,
// no RPC, no signature, no real funds, ever (AGENTS rule 5,
// BRO_PLAN.md §10).
//
// real part: the price. fills use the live observed Dexscreener price
// (passed in via Mover). everything else (the SOL balance, the token
// you "hold", the PnL) is a number in a local ledger.

import type { Mover } from "./discovery";

export const SEED_SOL = 10; // the sim wallet starts here
export const PER_TRADE_MAX_SOL = 5; // guardrail, enforced in code
export const DAILY_MAX_SOL = 20; // cumulative buys per day, in code
export const SIM_SLIPPAGE = 0.005; // 0.5% against you, so it is not perfect

export type Side = "buy" | "sell";

export type Fill = {
  id: string;
  ts: number;
  side: Side;
  symbol: string;
  mint: string;
  /** token units moved */
  tokens: number;
  /** sim SOL moved (out on buy, in on sell), after slippage */
  sol: number;
  /** observed USD price at fill time (real) */
  priceUsd: number;
  /** observed SOL/USD at fill time (real) */
  solUsd: number;
};

export type Ledger = { seedSol: number; fills: Fill[] };

export const EMPTY_LEDGER: Ledger = { seedSol: SEED_SOL, fills: [] };

export type Position = {
  symbol: string;
  mint: string;
  tokens: number;
  /** sim SOL spent acquiring the tokens still held (cost basis) */
  costSol: number;
  /** current sim SOL value at the live price */
  valueSol: number | null;
  pnlSol: number | null;
  pnlPct: number | null;
};

export type Wallet = {
  seedSol: number;
  /** uninvested sim SOL */
  cashSol: number;
  /** cashSol + sum(position value) */
  equitySol: number;
  positions: Position[];
  realizedPnlSol: number;
  /** equity vs seed, the headline number */
  totalPnlSol: number;
  totalPnlPct: number;
  cashUsd: number | null;
  equityUsd: number | null;
};

function priceMap(movers: Mover[]) {
  const m = new Map<string, Mover>();
  for (const t of movers) m.set(t.symbol, t);
  return m;
}

// derive everything from the fills (single source of truth). cost basis
// is average-cost: a sell releases a proportional slice of the basis
// and books realized PnL on it. pure: ledger + live prices + SOL/USD in,
// derived wallet out.
export function walletState(
  ledger: Ledger,
  movers: Mover[],
  solUsd: number | null,
): Wallet {
  const px = priceMap(movers);
  const solUsdRate = solUsd;

  let cashSol = ledger.seedSol;
  let realizedPnlSol = 0;
  const held = new Map<
    string,
    { mint: string; tokens: number; costSol: number }
  >();

  for (const f of ledger.fills) {
    if (f.side === "buy") {
      cashSol -= f.sol;
      const h = held.get(f.symbol) ?? { mint: f.mint, tokens: 0, costSol: 0 };
      h.tokens += f.tokens;
      h.costSol += f.sol;
      held.set(f.symbol, h);
    } else {
      cashSol += f.sol;
      const h = held.get(f.symbol);
      if (h && h.tokens > 0) {
        const frac = Math.min(1, f.tokens / h.tokens);
        const basisOut = h.costSol * frac;
        realizedPnlSol += f.sol - basisOut;
        h.tokens -= f.tokens;
        h.costSol -= basisOut;
        if (h.tokens <= 1e-9) held.delete(f.symbol);
        else held.set(f.symbol, h);
      }
    }
  }

  const positions: Position[] = [];
  for (const [symbol, h] of held) {
    const mv = px.get(symbol);
    const valueSol =
      mv?.priceUsd != null && solUsdRate
        ? (h.tokens * mv.priceUsd) / solUsdRate
        : null;
    positions.push({
      symbol,
      mint: h.mint,
      tokens: h.tokens,
      costSol: h.costSol,
      valueSol,
      pnlSol: valueSol == null ? null : valueSol - h.costSol,
      pnlPct:
        valueSol == null || h.costSol === 0
          ? null
          : ((valueSol - h.costSol) / h.costSol) * 100,
    });
  }
  positions.sort((a, b) => (b.valueSol ?? 0) - (a.valueSol ?? 0));

  const investedValue = positions.reduce((s, p) => s + (p.valueSol ?? 0), 0);
  const equitySol = cashSol + investedValue;
  const totalPnlSol = equitySol - ledger.seedSol;

  return {
    seedSol: ledger.seedSol,
    cashSol,
    equitySol,
    positions,
    realizedPnlSol,
    totalPnlSol,
    totalPnlPct: (totalPnlSol / ledger.seedSol) * 100,
    cashUsd: solUsdRate ? cashSol * solUsdRate : null,
    equityUsd: solUsdRate ? equitySol * solUsdRate : null,
  };
}

export type FillResult =
  | { ok: true; ledger: Ledger; fill: Fill }
  | { ok: false; reason: string };

function todaysBuySol(ledger: Ledger): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const c = start.getTime();
  return ledger.fills
    .filter((f) => f.side === "buy" && f.ts >= c)
    .reduce((s, f) => s + f.sol, 0);
}

// guardrails enforced HERE, in code, not in a prompt. violations come
// back as a human sentence the UI shows (rule 6).
export function buy(
  ledger: Ledger,
  mover: Mover,
  sizeSol: number,
  solUsd: number | null,
): FillResult {
  if (!Number.isFinite(sizeSol) || sizeSol <= 0)
    return { ok: false, reason: "enter a size in SOL first." };
  if (mover.priceUsd == null || !solUsd)
    return { ok: false, reason: `no live price for ${mover.symbol} right now. try again in a moment.` };
  if (sizeSol > PER_TRADE_MAX_SOL)
    return { ok: false, reason: `max ${PER_TRADE_MAX_SOL} SOL per trade (sim guardrail).` };

  const wallet = walletState(ledger, [mover], solUsd);
  if (sizeSol > wallet.cashSol + 1e-9)
    return { ok: false, reason: `not enough sim SOL. you have ${wallet.cashSol.toFixed(2)}.` };
  if (todaysBuySol(ledger) + sizeSol > DAILY_MAX_SOL)
    return { ok: false, reason: `that crosses the ${DAILY_MAX_SOL} SOL/day sim cap.` };

  // fill at the live price, 0.5% slippage against you
  const fillPrice = mover.priceUsd * (1 + SIM_SLIPPAGE);
  const tokens = (sizeSol * solUsd) / fillPrice;
  const fill: Fill = {
    id: `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    side: "buy",
    symbol: mover.symbol,
    mint: mover.mint,
    tokens,
    sol: sizeSol,
    priceUsd: mover.priceUsd,
    solUsd,
  };
  return { ok: true, ledger: { ...ledger, fills: [...ledger.fills, fill] }, fill };
}

export function sell(
  ledger: Ledger,
  mover: Mover,
  tokenAmount: number,
  solUsd: number | null,
): FillResult {
  if (mover.priceUsd == null || !solUsd)
    return { ok: false, reason: `no live price for ${mover.symbol} right now. try again in a moment.` };
  const wallet = walletState(ledger, [mover], solUsd);
  const pos = wallet.positions.find((p) => p.symbol === mover.symbol);
  if (!pos || pos.tokens <= 0)
    return { ok: false, reason: `you have no ${mover.symbol} position to sell.` };

  const amount = Math.min(tokenAmount, pos.tokens);
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, reason: "nothing to sell." };

  const fillPrice = mover.priceUsd * (1 - SIM_SLIPPAGE);
  const sol = (amount * fillPrice) / solUsd;
  const fill: Fill = {
    id: `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    side: "sell",
    symbol: mover.symbol,
    mint: mover.mint,
    tokens: amount,
    sol,
    priceUsd: mover.priceUsd,
    solUsd,
  };
  return { ok: true, ledger: { ...ledger, fills: [...ledger.fills, fill] }, fill };
}
