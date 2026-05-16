// bro's proxy for jabby's daemon snapshot (BRO_PLAN.md §9.2). feeds the
// status-bar detail and, later, the activity panel's stat tiles. null
// when jabby is unreachable, never a throw.

import { getState } from "@/lib/jabby";
import { isAppEnabled } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAppEnabled()) {
    return Response.json({ state: null, mode: "public" });
  }
  const state = await getState();
  return Response.json({ state });
}
