// a human-readable wallet snapshot, so jabby can answer "how's my
// paper wallet" in chat without doing the math itself. localhost only.

import { walletSummary } from "@/lib/trading/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await walletSummary());
}
