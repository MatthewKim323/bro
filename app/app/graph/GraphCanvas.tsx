"use client";

// the knowledge graph, phase-2 scaffold. this is the showpiece panel, so
// even before it is wired it must feel inevitable. what you see here is
// honest: a calm, deterministic constellation that "draws itself" and
// breathes, the panel's identity while the real explorer is built.
//
// the real thing (phase 4) reads gbrain directly (never through jabby's
// loop), opens calm at depth 1-2 on a seed (not 8k nodes raw), and runs
// its force simulation in a worker with level-of-detail. the lib is a
// deliberate perf-spike decision (BRO_PLAN.md §15 open #1), not guessed
// here. this layout settles, it never bounces (§3.6 / §8.2).
//
// nodes are tonal sage variants, never a rainbow (§8.2). hover gives
// ambient life only: it highlights, it does not claim data it lacks
// (rule 6, truthful). reduced motion: it appears already settled.

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

const W = 1000;
const H = 680;

// tiny seeded PRNG so server and client agree and the layout is stable
// across renders (no jank, no hydration drift).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = {
  id: number;
  x: number;
  y: number;
  r: number;
  tone: string;
  hub: boolean;
};

const TONES = [
  "var(--color-matcha)",
  "var(--color-sage-deep)",
  "var(--color-accent)",
  "var(--color-soft)",
];

function buildGraph() {
  const rnd = mulberry32(20260516);
  const nodes: Node[] = [];
  const hubs = 5;
  const total = 52;

  // hubs spread roughly across the field, larger, anchor the clusters
  for (let i = 0; i < hubs; i++) {
    const a = (i / hubs) * Math.PI * 2 + 0.6;
    const rad = 190 + rnd() * 70;
    nodes.push({
      id: i,
      x: W / 2 + Math.cos(a) * rad,
      y: H / 2 + Math.sin(a) * rad * 0.82,
      r: 9 + rnd() * 4,
      tone: TONES[i % 3],
      hub: true,
    });
  }

  // leaves orbit a random hub, small, the bulk of the cloud
  for (let i = hubs; i < total; i++) {
    const h = nodes[Math.floor(rnd() * hubs)];
    const a = rnd() * Math.PI * 2;
    const rad = 45 + rnd() * 135;
    nodes.push({
      id: i,
      x: Math.max(40, Math.min(W - 40, h.x + Math.cos(a) * rad)),
      y: Math.max(40, Math.min(H - 40, h.y + Math.sin(a) * rad)),
      r: 3 + rnd() * 3.5,
      tone: TONES[Math.floor(rnd() * TONES.length)],
      hub: false,
    });
  }

  // edges: every leaf to its nearest hub, plus a faint hub spine
  const edges: Array<[number, number]> = [];
  for (let i = hubs; i < total; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let h = 0; h < hubs; h++) {
      const dx = nodes[i].x - nodes[h].x;
      const dy = nodes[i].y - nodes[h].y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    edges.push([i, best]);
  }
  for (let h = 0; h < hubs; h++) edges.push([h, (h + 1) % hubs]);

  // adjacency for the hover highlight, built once with the layout so the
  // component holds a single memo (keeps the React Compiler happy: no
  // cross-memo dependency that could be mutated later).
  const neighbors = new Map<number, Set<number>>();
  for (const [a, b] of edges) {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    if (!neighbors.has(b)) neighbors.set(b, new Set());
    neighbors.get(a)!.add(b);
    neighbors.get(b)!.add(a);
  }

  return { nodes, edges, neighbors };
}

export function GraphCanvas() {
  const reduce = useReducedMotion();
  const { nodes, edges, neighbors } = useMemo(() => buildGraph(), []);
  const [hover, setHover] = useState<number | null>(null);

  function dim(id: number) {
    if (hover === null) return false;
    return hover !== id && !neighbors.get(hover)?.has(id);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="bro's knowledge graph, drawing itself"
    >
      <g>
        {edges.map(([a, b], i) => {
          const na = nodes[a];
          const nb = nodes[b];
          const faded = dim(a) || dim(b);
          return (
            <motion.line
              key={`e${i}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="var(--color-sage-deep)"
              strokeWidth={1}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: faded ? 0.06 : 0.22 }}
              transition={{
                duration: 0.9,
                delay: reduce ? 0 : 0.5 + (i % 12) * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}
      </g>

      <g>
        {nodes.map((n, i) => {
          const faded = dim(n.id);
          return (
            <motion.circle
              key={`n${n.id}`}
              cx={n.x}
              cy={n.y}
              // base r as a real attribute so the first paint is valid
              // SVG; motion still animates it for the hover enlarge.
              r={n.r}
              fill={n.tone}
              stroke="var(--color-bg)"
              strokeWidth={n.hub ? 2 : 1}
              initial={
                reduce ? false : { scale: 0, opacity: 0, transformOrigin: "center" }
              }
              animate={{
                scale: 1,
                opacity: faded ? 0.28 : 1,
                r: hover === n.id ? n.r * 1.18 : n.r,
              }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              transition={{
                duration: 0.7,
                delay: reduce ? 0 : (i % 16) * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            />
          );
        })}
      </g>
    </svg>
  );
}
