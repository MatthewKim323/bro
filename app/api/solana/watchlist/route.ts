// GET /api/solana/watchlist -> real live prices for the Solana tokens
// bro watches and paper-trades. not cached (always fresh), same pattern
// as /api/solana/pulse.

import { getSolanaWatchlist } from "@/lib/solana";

export async function GET() {
  const watchlist = await getSolanaWatchlist();
  return Response.json(watchlist);
}
