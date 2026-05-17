// the watchlist bro paper-trades: real Dexscreener prices, server-side
// cached. public market data, no jabby, no keys. the browser polls THIS,
// never Dexscreener directly. see BRO_PLAN.md §10.

import { getMovers } from "@/lib/trading/discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getMovers());
}
