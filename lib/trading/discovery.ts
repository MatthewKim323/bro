// the movers bro watches + paper-trades. SERVER ONLY.
//
// one batched Dexscreener call (public, no key, no wallet) resolves the
// watchlist to live price / 24h / liquidity / volume AND the best pool
// address (which the chart needs for GeckoTerminal OHLCV). prices are
// REAL; the wallet and fills are paper (lib/trading/engine). zero keys,
// zero RPC signing, zero real funds. see BRO_PLAN.md §10.
//
// the watchlist is config: tradeable memecoins by mint. add a coin by
// dropping its mint here (Dexscreener search resolves symbol -> mint).
// SOL is tracked separately, it is the sim wallet's base currency, not
// a thing you trade against itself.

// per-token endpoint. the comma-batched /latest/dex/tokens call silently
// drops very-new pump.fun mints (e.g. OPAL); this one is reliable per
// mint, so we fan out in parallel instead of batching.
const DEX = "https://api.dexscreener.com/token-pairs/v1/solana/";

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export type WatchDef = { symbol: string; name: string; mint: string };

// tradeable memecoins. real Solana mints. extend freely.
export const WATCHLIST: WatchDef[] = [
  { symbol: "OPAL", name: "Opal", mint: "2PzS5SYYWjUFvzXNFaMmRkpjkxGX6R5v8DnKYtdcpump" },
  { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "POPCAT", name: "Popcat", mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr" },
];

export type Mover = {
  symbol: string;
  name: string;
  mint: string;
  /** best (highest-liquidity) solana pool, used for the OHLCV chart */
  pool: string | null;
  dex: string | null;
  priceUsd: number | null;
  change24h: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
};

export type Movers = {
  ok: boolean;
  /** live SOL/USD, so the paper wallet can show a real dollar value */
  solUsd: number | null;
  tokens: Mover[];
  fetchedAt: number;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  baseToken?: { address?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

// calm cadence: a 25s server cache so the desk polling never hammers
// Dexscreener (and stays well under any informal rate limit).
let cache: { at: number; data: Movers } | null = null;
const TTL_MS = 25_000;

function bestPair(pairs: DexPair[], mint: string): DexPair | null {
  const mine = pairs.filter(
    (p) =>
      (p.chainId ?? "solana") === "solana" &&
      p.baseToken?.address?.toLowerCase() === mint.toLowerCase(),
  );
  mine.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  return mine[0] ?? null;
}

// one mint -> its pairs. the token-pairs/v1 endpoint returns a bare
// array. never throws; a miss is just an empty list.
async function fetchPairs(mint: string): Promise<DexPair[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(DEX + mint, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = (await res.json()) as DexPair[] | { pairs?: DexPair[] };
    return Array.isArray(json) ? json : (json.pairs ?? []);
  } catch {
    return [];
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

export async function getMovers(): Promise<Movers> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const mints = [SOL_MINT, ...WATCHLIST.map((w) => w.mint)];
  const fallback: Movers = {
    ok: false,
    solUsd: null,
    tokens: WATCHLIST.map((w) => ({
      symbol: w.symbol,
      name: w.name,
      mint: w.mint,
      pool: null,
      dex: null,
      priceUsd: null,
      change24h: null,
      liquidityUsd: null,
      volume24h: null,
    })),
    fetchedAt: Date.now(),
  };

  try {
    // fan out per mint in parallel; reliable for new pump.fun tokens
    const results = await Promise.all(mints.map((m) => fetchPairs(m)));
    const byMint = new Map<string, DexPair[]>();
    mints.forEach((m, i) => byMint.set(m, results[i]));

    const solUsd = num(bestPair(byMint.get(SOL_MINT) ?? [], SOL_MINT)?.priceUsd);
    const tokens: Mover[] = WATCHLIST.map((w) => {
      const p = bestPair(byMint.get(w.mint) ?? [], w.mint);
      return {
        symbol: w.symbol,
        name: w.name,
        mint: w.mint,
        pool: p?.pairAddress ?? null,
        dex: p?.dexId ?? null,
        priceUsd: num(p?.priceUsd),
        change24h: p?.priceChange?.h24 ?? null,
        liquidityUsd: p?.liquidity?.usd ?? null,
        volume24h: p?.volume?.h24 ?? null,
      };
    });

    const data: Movers = {
      ok: tokens.some((t) => t.priceUsd != null),
      solUsd,
      tokens,
      fetchedAt: Date.now(),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return fallback;
  }
}
