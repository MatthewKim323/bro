// open memecoin search: ?q=symbol|address. real Dexscreener search,
// server-side cached. browse any Solana coin, then chart + paper-trade
// it. see BRO_PLAN.md §10.

import { searchTokens } from "@/lib/trading/discovery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return Response.json({ tokens: await searchTokens(q) });
}
