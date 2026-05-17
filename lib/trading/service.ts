// the one trading service. SERVER ONLY. both front doors (the desk UI
// and jabby, via /api/trade/order) call through here, so the engine,
// the guardrails and the ledger are identical no matter who asked.
// BRO_PLAN.md §8.6 / §10.4.

import { getMovers, searchTokens, type Mover } from "./discovery";
import {
  buy as engineBuy,
  sell as engineSell,
  walletState,
  type Ledger,
} from "./engine";
import { withLedger, readLedger } from "./store";

const looksLikeMint = (s: string) => /^[A-Za-z0-9]{32,46}$/.test(s);

// resolve "OPAL" / a mint / "dog wif hat" to a live, priced coin plus
// the current SOL/USD. watchlist first (it is already polled + cached),
// then open Dexscreener search.
async function resolveCoin(
  query: string,
): Promise<{ mover: Mover; solUsd: number | null } | null> {
  const q = query.trim();
  if (!q) return null;
  const maybeMint = looksLikeMint(q) ? [q] : [];
  const movers = await getMovers(maybeMint);
  const solUsd = movers.solUsd;

  const ql = q.toLowerCase();
  const inList = movers.tokens.find(
    (t) =>
      t.priceUsd != null &&
      (t.symbol.toLowerCase() === ql || t.mint.toLowerCase() === ql),
  );
  if (inList) return { mover: inList, solUsd };

  const found = (await searchTokens(q)).find(
    (t) => t.priceUsd != null && t.pool,
  );
  return found ? { mover: found, solUsd } : null;
}

export type OrderResult = {
  ok: boolean;
  message: string;
  symbol?: string;
  fill?: { side: string; tokens: number; sol: number; priceUsd: number };
};

export async function placeOrder(input: {
  side: "buy" | "sell";
  query: string;
  sizeSol?: number;
}): Promise<OrderResult> {
  const resolved = await resolveCoin(input.query);
  if (!resolved) {
    return {
      ok: false,
      message: `couldn't find a tradeable Solana coin for "${input.query}".`,
    };
  }
  const { mover, solUsd } = resolved;

  return withLedger<OrderResult>(async (
    ledger: Ledger,
  ): Promise<{ next?: Ledger; result: OrderResult }> => {
    if (input.side === "buy") {
      const size = Number(input.sizeSol);
      if (!Number.isFinite(size) || size <= 0) {
        return {
          result: {
            ok: false,
            message: "how much SOL? give me a size to buy.",
          },
        };
      }
      const r = engineBuy(ledger, mover, size, solUsd);
      if (!r.ok) return { result: { ok: false, message: r.reason } };
      return {
        next: r.ledger,
        result: {
          ok: true,
          symbol: mover.symbol,
          message: `bought ${mover.symbol} with ${size} SOL (paper, sim).`,
          fill: {
            side: "buy",
            tokens: r.fill.tokens,
            sol: r.fill.sol,
            priceUsd: r.fill.priceUsd,
          },
        },
      };
    }

    // sell = close the whole position in that coin
    const w = walletState(ledger, [mover], solUsd);
    const pos = w.positions.find((p) => p.symbol === mover.symbol);
    if (!pos || pos.tokens <= 0) {
      return {
        result: {
          ok: false,
          message: `no ${mover.symbol} position to sell.`,
        },
      };
    }
    const r = engineSell(ledger, mover, pos.tokens, solUsd);
    if (!r.ok) return { result: { ok: false, message: r.reason } };
    return {
      next: r.ledger,
      result: {
        ok: true,
        symbol: mover.symbol,
        message: `closed ${mover.symbol} for ${r.fill.sol.toFixed(3)} SOL (paper, sim).`,
        fill: {
          side: "sell",
          tokens: r.fill.tokens,
          sol: r.fill.sol,
          priceUsd: r.fill.priceUsd,
        },
      },
    };
  });
}

// a human-readable wallet snapshot, used by jabby to answer "how's my
// paper wallet doing".
export async function walletSummary() {
  const ledger = await readLedger();
  const movers = await getMovers();
  const w = walletState(ledger, movers.tokens, movers.solUsd);
  return {
    seedSol: w.seedSol,
    equitySol: w.equitySol,
    cashSol: w.cashSol,
    pnlPct: w.totalPnlPct,
    positions: w.positions.map((p) => ({
      symbol: p.symbol,
      tokens: p.tokens,
      valueSol: p.valueSol,
      pnlPct: p.pnlPct,
    })),
  };
}
