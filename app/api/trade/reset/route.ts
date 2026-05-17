// reset the shared sim wallet back to seed. localhost paper only.

import { resetLedger } from "@/lib/trading/store";

export const dynamic = "force-dynamic";

export async function POST() {
  await resetLedger();
  return Response.json({ ok: true });
}
