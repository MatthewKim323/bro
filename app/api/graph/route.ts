// GET /api/graph -> bro's real knowledge graph from gbrain.
//
// nodes = real gbrain pages. edges = the relationships that genuinely
// exist: pages from the same source/namespace are linked (a real
// organizational relationship, e.g. the same discord channel or the
// same research company), so each source reads as one cluster. we do
// NOT invent semantic links. real per-page links/backlinks are exposed
// on click via /api/graph/node. honest "unavailable" when gbrain is
// not reachable (it is local-only by design).

import { listPages } from "@/lib/gbrain";

export async function GET() {
  const pages = await listPages(120);
  if (pages.length === 0) {
    return Response.json({
      ok: false,
      source: "unavailable",
      count: 0,
      nodes: [],
      edges: [],
    });
  }

  const nodes = pages.map((p, i) => ({
    id: i,
    slug: p.slug,
    title: p.title,
    type: p.type,
    date: p.date,
    group: p.slug.split("/")[0] || p.type || "page",
  }));

  const parentOf = (slug: string) => {
    const parts = slug.split("/");
    return parts.length > 1 ? parts.slice(0, -1).join("/") : parts[0];
  };

  const groupFirst = new Map<string, number>();
  const parentFirst = new Map<string, number>();
  nodes.forEach((n) => {
    if (!groupFirst.has(n.group)) groupFirst.set(n.group, n.id);
    const par = parentOf(n.slug);
    if (!parentFirst.has(par)) parentFirst.set(par, n.id);
  });

  const edges: Array<[number, number]> = [];
  nodes.forEach((n) => {
    const par = parentOf(n.slug);
    const pf = parentFirst.get(par)!;
    if (n.id !== pf) edges.push([n.id, pf]);
  });
  // tie each source's sub-folders together so a namespace is one cluster
  parentFirst.forEach((idx, par) => {
    const top = par.split("/")[0];
    const gf = groupFirst.get(top);
    if (gf != null && idx !== gf) edges.push([idx, gf]);
  });

  return Response.json({
    ok: true,
    source: "gbrain",
    count: nodes.length,
    nodes,
    edges,
  });
}
