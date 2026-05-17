// real gbrain access. SERVER ONLY.
//
// bro reads gbrain directly via its CLI (BRO_PLAN.md §9.3), decoupled
// from jabby's loop. gbrain is local-only, so this works on matt's
// machine and degrades honestly anywhere else (the graph panel shows a
// truthful "brain not reachable" state, never a faked constellation).
//
// every call is defensive: a short timeout, never throws, returns null
// or [] on any failure. the graph must never hang or crash the panel.

import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { promisify } from "node:util";

const pexec = promisify(execFile);

const BIN =
  process.env.GBRAIN_BIN ||
  `${homedir()}/.bun/bin/gbrain`;

const TIMEOUT = 5000;

async function gb(args: string[]): Promise<string | null> {
  try {
    const { stdout } = await pexec(BIN, args, {
      timeout: TIMEOUT,
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return null;
  }
}

export type GbPage = {
  slug: string;
  type: string;
  date: string;
  title: string;
};

// `gbrain list` prints TSV: slug<TAB>type<TAB>date<TAB>title, with the
// odd warning line mixed in. keep only well-formed rows.
export async function listPages(limit = 120): Promise<GbPage[]> {
  const out = await gb(["list", "-n", String(limit)]);
  if (!out) return [];
  const pages: GbPage[] = [];
  for (const line of out.split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 4) continue;
    const [slug, type, date, ...rest] = parts;
    if (!/^[\w][\w./-]*$/.test(slug)) continue; // skip warnings / junk
    pages.push({
      slug,
      type: type || "page",
      date: date || "",
      title: rest.join("\t").trim() || slug.split("/").pop() || slug,
    });
  }
  return pages;
}

type GraphNode = { slug: string; title?: string; type?: string; links?: unknown[] };

// `gbrain graph <slug> --depth N` -> JSON [{slug,title,type,depth,links}]
export async function pageLinks(slug: string): Promise<string[]> {
  const out = await gb(["graph", slug, "--depth", "1"]);
  if (!out) return [];
  try {
    const arr = JSON.parse(out) as GraphNode[];
    const root = arr.find((n) => n.slug === slug) ?? arr[0];
    const links = root?.links ?? [];
    return links
      .map((l) =>
        typeof l === "string"
          ? l
          : (l as { slug?: string; to?: string })?.slug ??
            (l as { to?: string })?.to ??
            "",
      )
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export async function backlinks(slug: string): Promise<string[]> {
  const out = await gb(["backlinks", slug]);
  if (!out) return [];
  try {
    const arr = JSON.parse(out) as Array<string | { slug?: string; from?: string }>;
    return arr
      .map((l) => (typeof l === "string" ? l : l?.slug ?? l?.from ?? ""))
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export type GbDetail = {
  slug: string;
  title: string;
  type: string;
  excerpt: string;
};

// `gbrain get <slug>` -> markdown with YAML frontmatter. pull a clean
// title/type from the frontmatter and a short body excerpt.
export async function getPage(slug: string): Promise<GbDetail | null> {
  const out = await gb(["get", slug]);
  if (!out) return null;
  let body = out;
  let title = slug.split("/").pop() || slug;
  let type = "page";
  const fm = out.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fm) {
    const meta = fm[1];
    body = fm[2];
    const t = meta.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
    const ty = meta.match(/^type:\s*['"]?(.+?)['"]?\s*$/m);
    if (t) title = t[1].trim();
    if (ty) type = ty[1].trim();
  }
  const excerpt = body
    .replace(/^#+\s.*$/gm, "")
    .replace(/[`*_>#]/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
  return { slug, title, type, excerpt };
}
