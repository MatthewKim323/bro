// GET /api/bro/graph -> the bro-owned knowledge graph grown from the
// Backboard chat (MongoDB Atlas). SEPARATE from /api/graph, which is
// jabby's read-only gbrain. this one builds itself as you talk to bro.

import { getGraph } from "@/lib/broGraph";

export const runtime = "nodejs";

export async function GET() {
  const g = await getGraph(80);
  return Response.json(g);
}
