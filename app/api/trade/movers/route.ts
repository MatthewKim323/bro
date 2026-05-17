// the desk's live prices: the watchlist + any coins you searched into
// or currently hold (?extra=mint,mint). real Dexscreener, server-side
// cached. the browser polls THIS, never Dexscreener directly.
// see BRO_PLAN.md §10.

import { getMovers } from "@/lib/trading/discovery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const extra = (new URL(req.url).searchParams.get("extra") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  return Response.json(await getMovers(extra));
}
