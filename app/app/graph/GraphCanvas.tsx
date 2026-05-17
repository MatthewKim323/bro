"use client";

// the knowledge graph, wired to real gbrain (BRO_PLAN.md §8.2 / §9.3).
//
// every node is a real page bro has ingested. clusters are real sources
// (same discord channel, same research company...). edges are real
// organizational relationships; a node's real per-page links + backlinks
// load on click from /api/graph/node. nothing is invented: an empty
// links list means the page genuinely has none yet (rule 6, truthful).
//
// interaction: scroll/buttons to zoom, drag to pan, click a node to open
// the real page. honest states for loading + "brain not reachable"
// (gbrain is local-only by design, so the deployed build never has it).
// reduced motion: it renders already settled.

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const W = 1000;
const H = 680;
const TONES = [
  "var(--color-sage-deep)",
  "var(--color-matcha)",
  "var(--color-accent)",
  "var(--color-soft)",
];

type ApiNode = {
  id: number;
  slug: string;
  title: string;
  type: string;
  date: string;
  group: string;
};
type GraphData = {
  ok: boolean;
  source: string;
  count: number;
  nodes: ApiNode[];
  edges: [number, number][];
};
type Detail = {
  ok: boolean;
  slug: string;
  title: string;
  type: string;
  excerpt: string;
  links: string[];
  backlinks: string[];
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

type Placed = ApiNode & { x: number; y: number; r: number; tone: string };

function layout(data: GraphData) {
  const groups = [...new Set(data.nodes.map((n) => n.group))];
  const gi = new Map(groups.map((g, i) => [g, i]));
  const center = { x: W / 2, y: H / 2 };
  const ring = Math.min(W, H) * 0.31;

  const deg = new Map<number, number>();
  data.edges.forEach(([a, b]) => {
    deg.set(a, (deg.get(a) ?? 0) + 1);
    deg.set(b, (deg.get(b) ?? 0) + 1);
  });

  const byGroup = new Map<string, ApiNode[]>();
  data.nodes.forEach((n) => {
    if (!byGroup.has(n.group)) byGroup.set(n.group, []);
    byGroup.get(n.group)!.push(n);
  });

  const placed: Placed[] = [];
  byGroup.forEach((members, g) => {
    const idx = gi.get(g)!;
    const ga =
      groups.length === 1
        ? 0
        : (idx / groups.length) * Math.PI * 2 - Math.PI / 2;
    const gx = groups.length === 1 ? center.x : center.x + Math.cos(ga) * ring;
    const gy = groups.length === 1 ? center.y : center.y + Math.sin(ga) * ring;
    const spread = 60 + Math.min(members.length, 40) * 6;
    members.forEach((n, k) => {
      const d = deg.get(n.id) ?? 1;
      if (k === 0) {
        placed.push({ ...n, x: gx, y: gy, r: 9, tone: TONES[idx % TONES.length] });
        return;
      }
      // phyllotaxis-ish ring around the group hub, deterministic jitter
      const ang = k * 2.399963 + hash(n.slug) * 0.8;
      const rad = spread * Math.sqrt(k / members.length) + 14;
      placed.push({
        ...n,
        x: Math.max(28, Math.min(W - 28, gx + Math.cos(ang) * rad)),
        y: Math.max(28, Math.min(H - 28, gy + Math.sin(ang) * rad * 0.92)),
        r: 3.5 + Math.min(d, 6) * 0.9,
        tone: TONES[idx % TONES.length],
      });
    });
  });
  placed.sort((a, b) => a.id - b.id);
  return placed;
}

export function GraphCanvas() {
  const reduce = useReducedMotion();
  const [data, setData] = useState<GraphData | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [selSlug, setSelSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ on: boolean; sx: number; sy: number; moved: boolean }>({
    on: false,
    sx: 0,
    sy: 0,
    moved: false,
  });

  useEffect(() => {
    let alive = true;
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d: GraphData) => alive && setData(d))
      .catch(() => alive && setData({ ok: false, source: "unavailable", count: 0, nodes: [], edges: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const nodes = useMemo(() => (data?.ok ? layout(data) : []), [data]);
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const adj = useMemo(() => {
    const m = new Map<number, Set<number>>();
    data?.edges.forEach(([a, b]) => {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    });
    return m;
  }, [data]);

  function openNode(slug: string) {
    setSelSlug(slug);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/graph/node?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: Detail) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }

  function clientToSvg(cx: number, cy: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = cx;
    p.y = cy;
    const inv = p.matrixTransform(ctm.inverse());
    return { x: inv.x, y: inv.y };
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const p = clientToSvg(e.clientX, e.clientY);
    setView((v) => {
      const k = Math.min(6, Math.max(0.4, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      const cxp = (p.x - v.x) / v.k;
      const cyp = (p.y - v.y) / v.k;
      return { k, x: p.x - cxp * k, y: p.y - cyp * k };
    });
  }
  function zoomBy(f: number) {
    setView((v) => {
      const k = Math.min(6, Math.max(0.4, v.k * f));
      const cx = W / 2;
      const cy = H / 2;
      const cxp = (cx - v.x) / v.k;
      const cyp = (cy - v.y) / v.k;
      return { k, x: cx - cxp * k, y: cy - cyp * k };
    });
  }

  const selId = nodes.find((n) => n.slug === selSlug)?.id ?? null;
  const focus = hover ?? selId;
  const dim = (id: number) =>
    focus !== null && focus !== id && !adj.get(focus)?.has(id);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="bro's knowledge graph from gbrain"
        onWheel={onWheel}
        onPointerDown={(e) => {
          drag.current = { on: true, sx: e.clientX, sy: e.clientY, moved: false };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current.on) return;
          const dx = e.clientX - drag.current.sx;
          const dy = e.clientY - drag.current.sy;
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
          drag.current.sx = e.clientX;
          drag.current.sy = e.clientY;
          const r = svgRef.current!.getBoundingClientRect();
          setView((v) => ({
            ...v,
            x: v.x + (dx / r.width) * W,
            y: v.y + (dy / r.height) * H,
          }));
        }}
        onPointerUp={() => (drag.current.on = false)}
        onDoubleClick={() => setView({ k: 1, x: 0, y: 0 })}
        style={{ cursor: drag.current.on ? "grabbing" : "grab" }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {data?.edges.map(([a, b], i) => {
            const na = pos.get(a);
            const nb = pos.get(b);
            if (!na || !nb) return null;
            const faded = dim(a) || dim(b);
            return (
              <line
                key={`e${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="var(--color-sage-deep)"
                strokeWidth={1 / view.k}
                opacity={faded ? 0.05 : 0.2}
              />
            );
          })}
          {nodes.map((n, i) => {
            const faded = dim(n.id);
            const isSel = n.slug === selSlug;
            return (
              <g
                key={`n${n.id}`}
                transform={`translate(${n.x} ${n.y})`}
                opacity={faded ? 0.25 : 1}
                style={{
                  cursor: "pointer",
                  transition: reduce ? undefined : "opacity .3s",
                }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (!drag.current.moved) openNode(n.slug);
                }}
              >
                {isSel && (
                  <circle
                    r={n.r + 5}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={1.5 / view.k}
                  />
                )}
                <circle
                  r={hover === n.id ? n.r * 1.18 : n.r}
                  fill={n.tone}
                  stroke="var(--color-bg)"
                  strokeWidth={(n.r >= 9 ? 2 : 1) / view.k}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* zoom controls */}
      {data?.ok && (
        <div className="absolute right-4 top-4 flex flex-col overflow-hidden rounded-bro border border-line bg-bg/80 backdrop-blur">
          {[
            ["+", () => zoomBy(1.25)],
            ["−", () => zoomBy(0.8)],
            ["⤢", () => setView({ k: 1, x: 0, y: 0 })],
          ].map(([label, fn]) => (
            <button
              key={label as string}
              onClick={fn as () => void}
              className="flex h-9 w-9 items-center justify-center text-soft transition-colors hover:bg-surface hover:text-ink"
              aria-label={label === "⤢" ? "reset view" : label === "+" ? "zoom in" : "zoom out"}
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      {/* honest status line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-8 pb-8 text-center">
        {!data && (
          <p className="bro-display text-xl text-ink/85">
            reaching into bro&rsquo;s memory...
          </p>
        )}
        {data && !data.ok && (
          <>
            <p className="bro-display text-xl text-ink/85">
              bro&rsquo;s brain isn&rsquo;t reachable from here.
            </p>
            <p className="text-[12px] text-soft">
              gbrain is local-only by design. run this on the machine
              where bro lives.
            </p>
          </>
        )}
        {data?.ok && !selSlug && (
          <p className="text-[12px] text-soft">
            {data.count} pages bro has ingested, clustered by source.
            scroll to zoom, drag to pan, click a node for the real page.
          </p>
        )}
      </div>

      {/* node detail (real gbrain page) */}
      {selSlug && (
        <div className="absolute right-4 top-16 z-10 flex max-h-[78%] w-80 flex-col overflow-hidden rounded-bro border border-line bg-bg shadow-[0_20px_50px_-24px_rgba(35,36,31,0.4)]">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <span className="bro-label">{detail?.type || "page"}</span>
              <h3 className="bro-display mt-1 truncate text-lg text-ink">
                {detail?.title || selSlug.split("/").pop()}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[11px] text-soft">
                {selSlug}
              </p>
            </div>
            <button
              onClick={() => {
                setSelSlug(null);
                setDetail(null);
              }}
              className="text-soft hover:text-ink"
              aria-label="close"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed">
            {detailLoading && <p className="text-soft">opening the page...</p>}
            {detail?.ok && (
              <>
                <p className="bro-body">{detail.excerpt || "no body text."}</p>
                <Rel title="links" items={detail.links} pos={pos} onOpen={openNode} nodes={nodes} />
                <Rel title="backlinks" items={detail.backlinks} pos={pos} onOpen={openNode} nodes={nodes} />
              </>
            )}
            {detail && !detail.ok && (
              <p className="text-soft">couldn&rsquo;t open that page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Rel({
  title,
  items,
  onOpen,
  nodes,
}: {
  title: string;
  items: string[];
  pos: Map<number, unknown>;
  nodes: { slug: string }[];
  onOpen: (s: string) => void;
}) {
  return (
    <div className="mt-5">
      <span className="bro-label">{title}</span>
      {items.length === 0 ? (
        <p className="mt-2 text-[12px] text-soft">
          none recorded yet.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {items.map((s) => {
            const known = nodes.some((n) => n.slug === s);
            return (
              <li key={s}>
                <button
                  disabled={!known}
                  onClick={() => onOpen(s)}
                  className={`truncate text-left font-mono text-[11px] ${
                    known
                      ? "text-accent hover:underline"
                      : "cursor-default text-soft"
                  }`}
                >
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
