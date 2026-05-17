// the movers bro watches + paper-trades, plus open search over any
// Solana memecoin. SERVER ONLY.
//
// Dexscreener public API (no key, no wallet). prices are REAL; the
// wallet and fills are paper (lib/trading/engine). zero keys, zero RPC
// signing, zero real funds. see BRO_PLAN.md §10.
//
// the watchlist is just the default quick-pick. `extra` mints (whatever
// you searched into or currently hold) are resolved alongside it so a
// non-watchlist coin still stays live-priced for its chart, position
// value and PnL. search resolves any coin by symbol or address.

// per-token endpoint. the comma-batched /latest/dex/tokens call silently
// drops very-new pump.fun mints; this one is reliable per mint, so we
// fan out in parallel.
const DEX_TOKEN = "https://api.dexscreener.com/token-pairs/v1/solana/";
const DEX_SEARCH = "https://api.dexscreener.com/latest/dex/search?q=";

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export type WatchDef = { symbol: string; name: string; mint: string };

// default quick-pick. real Solana mints. extend freely.
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
  pool: string | null;
  dex: string | null;
  priceUsd: number | null;
  change24h: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
};

export type Movers = {
  ok: boolean;
  solUsd: number | null;
  tokens: Mover[];
  fetchedAt: number;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

function bestPair(pairs: DexPair[], mint: string): DexPair | null {
  const mine = pairs.filter(
    (p) =>
      (p.chainId ?? "solana") === "solana" &&
      p.baseToken?.address?.toLowerCase() === mint.toLowerCase(),
  );
  mine.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  return mine[0] ?? null;
}

const KNOWN = new Map(WATCHLIST.map((w) => [w.mint, w]));

function toMover(mint: string, p: DexPair | null): Mover {
  const w = KNOWN.get(mint);
  const symbol =
    w?.symbol ?? p?.baseToken?.symbol ?? `${mint.slice(0, 4)}…`;
  return {
    symbol,
    name: w?.name ?? p?.baseToken?.name ?? symbol,
    mint,
    pool: p?.pairAddress ?? null,
    dex: p?.dexId ?? null,
    priceUsd: num(p?.priceUsd),
    change24h: p?.priceChange?.h24 ?? null,
    liquidityUsd: p?.liquidity?.usd ?? null,
    volume24h: p?.volume?.h24 ?? null,
  };
}

// one mint -> its pairs. token-pairs/v1 returns a bare array. never
// throws; a miss is just an empty list.
async function fetchPairs(mint: string): Promise<DexPair[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(DEX_TOKEN + mint, {
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

// calm cadence: a short server cache keyed by the exact mint set so the
// desk polling never hammers Dexscreener.
const moversCache = new Map<string, { at: number; data: Movers }>();
const MOVERS_TTL = 20_000;

export async function getMovers(extra: string[] = []): Promise<Movers> {
  const want = Array.from(
    new Set([...WATCHLIST.map((w) => w.mint), ...extra.filter(Boolean)]),
  );
  const key = want.slice().sort().join(",");
  const hit = moversCache.get(key);
  if (hit && Date.now() - hit.at < MOVERS_TTL) return hit.data;

  const fallback: Movers = {
    ok: false,
    solUsd: null,
    tokens: want.map((m) => toMover(m, null)),
    fetchedAt: Date.now(),
  };

  try {
    const mints = [SOL_MINT, ...want];
    const results = await Promise.all(mints.map((m) => fetchPairs(m)));
    const byMint = new Map<string, DexPair[]>();
    mints.forEach((m, i) => byMint.set(m, results[i]));

    const solUsd = num(bestPair(byMint.get(SOL_MINT) ?? [], SOL_MINT)?.priceUsd);
    const tokens = want.map((m) => toMover(m, bestPair(byMint.get(m) ?? [], m)));

    const data: Movers = {
      ok: tokens.some((t) => t.priceUsd != null),
      solUsd,
      tokens,
      fetchedAt: Date.now(),
    };
    moversCache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return fallback;
  }
}

// open search: any Solana memecoin by symbol or address. dedup by mint,
// best pool per mint, ranked by liquidity. cached briefly per query.
const searchCache = new Map<string, { at: number; data: Mover[] }>();
const SEARCH_TTL = 30_000;

export async function searchTokens(query: string): Promise<Mover[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = q.toLowerCase();
  const hit = searchCache.get(key);
  if (hit && Date.now() - hit.at < SEARCH_TTL) return hit.data;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(DEX_SEARCH + encodeURIComponent(q), {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = (await res.json()) as { pairs?: DexPair[] };
    const sol = (json.pairs ?? []).filter((p) => p.chainId === "solana");

    const byMint = new Map<string, DexPair[]>();
    for (const p of sol) {
      const m = p.baseToken?.address;
      if (!m) continue;
      if (!byMint.has(m)) byMint.set(m, []);
      byMint.get(m)!.push(p);
    }
    const movers = Array.from(byMint.entries())
      .map(([m, ps]) => toMover(m, bestPair(ps, m)))
      .filter((t) => t.priceUsd != null && t.pool)
      .sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))
      .slice(0, 14);

    searchCache.set(key, { at: Date.now(), data: movers });
    return movers;
  } catch {
    return [];
  }
}
