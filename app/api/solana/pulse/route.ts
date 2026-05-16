// GET /api/solana/pulse -> a live, real read off Solana mainnet.
// route handlers are not cached by default in Next 16, which is what
// we want here (always fresh on-chain data).

import { getSolanaPulse } from "@/lib/solana";

export async function GET() {
  const pulse = await getSolanaPulse();
  return Response.json(pulse);
}
