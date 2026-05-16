// bro's own health endpoint. the browser polls THIS, never jabby
// directly (BRO_PLAN.md §9.1). it proxies jabby's /api/health and
// always answers calmly: a dead daemon is { ok:false }, not a 500.
// in the public build there is no daemon to reach, so it simply
// reports offline, which is correct.

import { getHealth } from "@/lib/jabby";
import { isAppEnabled } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAppEnabled()) {
    return Response.json({ ok: false, now: Date.now(), mode: "public" });
  }
  const health = await getHealth();
  return Response.json(health);
}
