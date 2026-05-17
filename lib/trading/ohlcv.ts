// real price history for the chart. SERVER ONLY.
//
// GeckoTerminal public API (no key): the OHLCV of a specific solana
// pool. free tier is ~30 req/min, so every result is cached per
// pool+timeframe on a calm TTL. the desk reads this through
// /api/trade/ohlcv, never the browser hitting GeckoTerminal directly.
// see BRO_PLAN.md §10.2.

const GT = "https://api.geckoterminal.com/api/v2/networks/solana/pools";

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export type Timeframe = "1m" | "1h" | "1d";

// timeframe -> GeckoTerminal (resolution, aggregate, candles, cache ttl).
// "1m" is the live view: a short TTL so the desk can poll it every few
// seconds and the chart actually moves.
const TF: Record<Timeframe, { res: string; agg: number; limit: number; ttl: number }> = {
  "1m": { res: "minute", agg: 1, limit: 120, ttl: 7_000 },
  "1h": { res: "hour", agg: 1, limit: 72, ttl: 60_000 },
  "1d": { res: "day", agg: 1, limit: 90, ttl: 300_000 },
};

export type OhlcvResult = {
  ok: boolean;
  pool: string;
  timeframe: Timeframe;
  candles: Candle[];
};

const cache = new Map<string, { at: number; data: OhlcvResult }>();

export async function getOhlcv(
  pool: string,
  timeframe: Timeframe = "1h",
): Promise<OhlcvResult> {
  const tf = TF[timeframe];
  const key = `${pool}:${timeframe}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < tf.ttl) return hit.data;

  const empty: OhlcvResult = { ok: false, pool, timeframe, candles: [] };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const url = `${GT}/${pool}/ohlcv/${tf.res}?aggregate=${tf.agg}&limit=${tf.limit}`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return empty;

    const json = (await res.json()) as {
      data?: { attributes?: { ohlcv_list?: number[][] } };
    };
    const list = json?.data?.attributes?.ohlcv_list ?? [];
    // GeckoTerminal returns newest first; the chart wants oldest -> newest
    const candles: Candle[] = list
      .map((c) => ({ t: c[0], o: c[1], h: c[2], l: c[3], c: c[4], v: c[5] }))
      .filter((c) => Number.isFinite(c.c))
      .sort((a, b) => a.t - b.t);

    const data: OhlcvResult = {
      ok: candles.length > 0,
      pool,
      timeframe,
      candles,
    };
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return empty;
  }
}
