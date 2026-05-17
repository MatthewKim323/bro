// the one order endpoint. the desk ticket AND jabby (when you ask it in
// chat) POST here. same engine, same guardrails, same ledger, whoever
// calls. body: { side: "buy"|"sell", query: "OPAL"|mint, sizeSol? }.
// paper only: real price, simulated fill, no keypair, no real funds.
// BRO_PLAN.md §8.6 / §10.4.

import { placeOrder } from "@/lib/trading/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { side?: unknown; query?: unknown; sizeSol?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { ok: false, message: "bad request body." },
      { status: 400 },
    );
  }

  const side = body.side === "sell" ? "sell" : "buy";
  const query = String(body.query ?? "").trim();
  const sizeSol =
    body.sizeSol == null ? undefined : Number(body.sizeSol);

  if (!query) {
    return Response.json({ ok: false, message: "which coin?" });
  }

  const result = await placeOrder({ side, query, sizeSol });
  return Response.json(result);
}
