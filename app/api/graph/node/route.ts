// GET /api/graph/node?slug=... -> the real gbrain page behind a node:
// title, type, a short excerpt, and its real links + backlinks. this is
// where the genuine per-page relationships surface (on click), pulled
// live from gbrain. never faked: empty arrays mean the page really has
// no recorded links yet.

import { getPage, pageLinks, backlinks } from "@/lib/gbrain";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[\w][\w./-]*$/.test(slug)) {
    return Response.json({ ok: false, error: "bad slug" }, { status: 400 });
  }
  const [detail, links, back] = await Promise.all([
    getPage(slug),
    pageLinks(slug),
    backlinks(slug),
  ]);
  if (!detail) {
    return Response.json({ ok: false, error: "not found" }, { status: 404 });
  }
  return Response.json({
    ok: true,
    ...detail,
    links,
    backlinks: back,
  });
}
