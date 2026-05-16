// real Solana mainnet read. SERVER ONLY.
//
// one JSON-RPC call (getEpochInfo) to a public Solana RPC. no key, no
// wallet, no signing: a genuine on-chain read, surfaced as a live
// "powered by Solana" pulse on the landing. hella minimal, fully real.
// the product narrative (bro paper-trades Solana memecoins) is the
// reason Solana is in the stack; this is the honest live proof of it.

const RPC =
  process.env.SOLANA_RPC_URL?.replace(/\/$/, "") ||
  "https://api.mainnet-beta.solana.com";

export type SolanaPulse = {
  ok: boolean;
  slot: number | null;
  epoch: number | null;
  /** position within the current epoch, and the epoch length */
  slotIndex: number | null;
  slotsInEpoch: number | null;
  blockHeight: number | null;
  /** lifetime transactions processed by the network */
  transactionCount: number | null;
  /** host only, for display (never leak a keyed RPC url to the client) */
  host: string;
};

export async function getSolanaPulse(): Promise<SolanaPulse> {
  const host = (() => {
    try {
      return new URL(RPC).host;
    } catch {
      return "solana";
    }
  })();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getEpochInfo" }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const offline = {
      ok: false,
      slot: null,
      epoch: null,
      slotIndex: null,
      slotsInEpoch: null,
      blockHeight: null,
      transactionCount: null,
      host,
    };
    if (!res.ok) return offline;
    const json = (await res.json()) as {
      result?: {
        absoluteSlot?: number;
        epoch?: number;
        slotIndex?: number;
        slotsInEpoch?: number;
        blockHeight?: number;
        transactionCount?: number;
      };
    };
    const r = json?.result;
    return {
      ok: Boolean(r),
      slot: r?.absoluteSlot ?? null,
      epoch: r?.epoch ?? null,
      slotIndex: r?.slotIndex ?? null,
      slotsInEpoch: r?.slotsInEpoch ?? null,
      blockHeight: r?.blockHeight ?? null,
      transactionCount: r?.transactionCount ?? null,
      host,
    };
  } catch {
    return {
      ok: false,
      slot: null,
      epoch: null,
      slotIndex: null,
      slotsInEpoch: null,
      blockHeight: null,
      transactionCount: null,
      host,
    };
  }
}

// the watchlist: real live prices for the well-known Solana tokens bro
// watches and paper-trades. one request to the Dexscreener public API
// (no key, no wallet). SERVER ONLY. prices are real; trading is paper.

export type WatchToken = {
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24h: number | null;
  volumeUsd: number | null;
};

export type SolanaWatchlist = { ok: boolean; tokens: WatchToken[] };

const WATCH: { mint: string; symbol: string; name: string }[] = [
  { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "solana" },
  { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "bonk" },
  { mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", symbol: "WIF", name: "dogwifhat" },
  { mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "jupiter" },
  { mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", symbol: "POPCAT", name: "popcat" },
];

type DexPair = {
  chainId?: string;
  baseToken?: { address?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

export async function getSolanaWatchlist(): Promise<SolanaWatchlist> {
  const fallback: SolanaWatchlist = {
    ok: false,
    tokens: WATCH.map((w) => ({
      symbol: w.symbol,
      name: w.name,
      priceUsd: null,
      change24h: null,
      volumeUsd: null,
    })),
  };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url =
      "https://api.dexscreener.com/latest/dex/tokens/" +
      WATCH.map((w) => w.mint).join(",");
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return fallback;
    const json = (await res.json()) as { pairs?: DexPair[] };
    const pairs = json?.pairs ?? [];
    const tokens = WATCH.map((w) => {
      const mine = pairs.filter(
        (p) =>
          p.chainId === "solana" &&
          p.baseToken?.address?.toLowerCase() === w.mint.toLowerCase(),
      );
      const best = mine.sort(
        (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
      )[0];
      const price = best?.priceUsd != null ? Number(best.priceUsd) : null;
      return {
        symbol: w.symbol,
        name: w.name,
        priceUsd: Number.isFinite(price as number) ? price : null,
        change24h: best?.priceChange?.h24 ?? null,
        volumeUsd: best?.volume?.h24 ?? null,
      };
    });
    return { ok: tokens.some((t) => t.priceUsd != null), tokens };
  } catch {
    return fallback;
  }
}
