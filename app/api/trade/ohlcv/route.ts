// real price history for the selected token's chart. GeckoTerminal via
// the server-cached lib. ?pool=<solana pool>&tf=1h|1d. public market
// data, no jabby, no keys. see BRO_PLAN.md §10.2.

import { getOhlcv, type Timeframe } from "@/lib/trading/ohlcv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pool = url.searchParams.get("pool")?.trim();
  const tfRaw = url.searchParams.get("tf");
  const tf: Timeframe = tfRaw === "1d" ? "1d" : "1h";

  if (!pool || !/^[A-Za-z0-9]{20,60}$/.test(pool)) {
    return Response.json(
      { ok: false, pool: pool ?? "", timeframe: tf, candles: [] },
      { status: 400 },
    );
  }
  return Response.json(await getOhlcv(pool, tf));
}
