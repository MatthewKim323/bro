// the shared server ledger (seed + fills). the desk polls this and
// computes the live wallet client-side against its price feed; jabby
// writes to the same ledger via /api/trade/order. one wallet, two
// front doors. localhost paper only, no funds, no keys. §10.4.

import { readLedger } from "@/lib/trading/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await readLedger());
}
