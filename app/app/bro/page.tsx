"use client";

// /app/bro — the REAL Backboard chat, fully separate from jabby.
//
// chat runs through Backboard (persona = bro, so it answers as bro, not
// "Kobe"); every turn persists to MongoDB Atlas and grows the bro-owned
// graph on the right, which you watch build itself as you talk. jabby
// and gbrain are never touched by anything on this page. it is NOT in
// the sidebar yet on purpose: the shell files are mid-rework by the
// other session, this ships as its own route to avoid clobbering them.

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel } from "@/app/components/Panel";
import { Label } from "@/app/components/Label";

type Step = { label: string; ms?: number };
type Turn = { role: "you" | "bro"; text: string; steps?: Step[] };
type GNode = { id: string; label: string; count: number };
type GEdge = { a: string; b: string; weight: number };

const W = 520;
const H = 460;

function layout(nodes: GNode[]) {
  const cx = W / 2;
  const cy = H / 2;
  const max = Math.max(1, ...nodes.map((n) => n.count));
  return nodes.map((n, i) => {
    // strongest nodes pulled toward the center, the long tail orbits out
    const t = n.count / max;
    const ring = 40 + (1 - t) * 180;
    const ang = i * 2.399963 + 0.5;
    return {
      ...n,
      x: cx + Math.cos(ang) * ring,
      y: cy + Math.sin(ang) * ring * 0.86,
      r: 5 + t * 12,
    };
  });
}

export default function BroChatPanel() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([
    { role: "bro", text: "yo. i'm bro, running on Backboard here. talk to me, watch the graph on the right build itself from what we say." },
  ]);
  const [busy, setBusy] = useState(false);
  const [graph, setGraph] = useState<{ nodes: GNode[]; edges: GEdge[] }>({
    nodes: [],
    edges: [],
  });
  const threadId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadGraph = useCallback(() => {
    fetch("/api/bro/graph")
      .then((r) => r.json())
      .then((g: { ok: boolean; nodes: GNode[]; edges: GEdge[] }) => {
        if (g.ok) setGraph({ nodes: g.nodes, edges: g.edges });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  function scrollDown() {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "you", text: msg }]);
    setBusy(true);
    scrollDown();
    try {
      const res = await fetch("/api/bro/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, threadId: threadId.current }),
      });
      const data = (await res.json()) as {
        reply?: string;
        threadId?: string | null;
        steps?: Step[];
      };
      if (data.threadId) threadId.current = data.threadId;
      setTurns((t) => [
        ...t,
        {
          role: "bro",
          text: data.reply || "bro got cut off. try again.",
          steps: data.steps,
        },
      ]);
      loadGraph();
    } catch {
      setTurns((t) => [
        ...t,
        { role: "bro", text: "bro got cut off. try again." },
      ]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  const placed = layout(graph.nodes).filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  const pos = new Map(placed.map((p) => [p.id, p]));

  return (
    <div className="grid h-full gap-6 p-6 lg:grid-cols-2">
      {/* chat (Backboard) */}
      <Panel title="chat with bro" className="h-full">
        <div className="flex h-full flex-col">
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2 overflow-y-auto pb-4"
          >
            {turns.map((t, i) => (
              <div
                key={i}
                className={`flex ${t.role === "you" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex max-w-[80%] flex-col gap-1.5">
                  <div
                    className={`rounded-[16px] px-4 py-2.5 text-[14px] leading-relaxed ${
                      t.role === "you"
                        ? "bg-accent text-bg"
                        : "bg-surface text-ink"
                    }`}
                  >
                    {t.text}
                  </div>
                  {t.role === "bro" && t.steps && t.steps.length > 0 && (
                    <Trace steps={t.steps} />
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-[16px] bg-surface px-4 py-2.5 text-[14px] text-soft">
                  thinking...
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line pt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="talk to bro..."
              className="min-w-0 flex-1 rounded-bro border border-line bg-bg px-4 py-2.5 text-[14px] text-ink outline-none placeholder:text-soft/70 focus:border-accent/50"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="rounded-bro bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              send
            </button>
          </div>
          <p className="mt-3 text-[11px] text-soft">
            real Backboard (persona + memory). stored in MongoDB Atlas.
            separate from jabby.
          </p>
        </div>
      </Panel>

      {/* the graph it builds */}
      <Panel
        title="builds itself as you talk"
        className="h-full"
        action={
          <span className="text-[12px] text-soft">
            {graph.nodes.length} from this chat
          </span>
        }
      >
        <div className="relative h-full w-full overflow-hidden">
          {placed.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Label>nothing yet</Label>
              <p className="bro-body max-w-xs text-sm text-soft">
                start talking. entities and topics from the conversation
                appear here, stored in MongoDB, never in jabby&rsquo;s brain.
              </p>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full"
            >
              {graph.edges.map((e, i) => {
                const a = pos.get(e.a);
                const b = pos.get(e.b);
                if (
                  !a ||
                  !b ||
                  !Number.isFinite(a.x) ||
                  !Number.isFinite(a.y) ||
                  !Number.isFinite(b.x) ||
                  !Number.isFinite(b.y)
                )
                  return null;
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--color-sage-deep)"
                    strokeWidth={Math.min(3, e.weight)}
                    opacity={0.2}
                  />
                );
              })}
              {placed.map((n) => (
                <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
                  <circle
                    r={n.r}
                    fill="var(--color-matcha)"
                    stroke="var(--color-bg)"
                    strokeWidth={1.5}
                  />
                  <text
                    y={-n.r - 5}
                    textAnchor="middle"
                    className="fill-soft"
                    style={{ fontSize: 11 }}
                  >
                    {n.label}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </Panel>
    </div>
  );
}

// the "what bro did" trace: collapsed by default (BRO_PLAN §8.1 rule 2),
// every line is something bro's own server genuinely did this turn.
function Trace({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-[11px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-soft transition-colors hover:text-ink"
      >
        <span
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        what bro did · {steps.length} step{steps.length === 1 ? "" : "s"}
      </button>
      {open && (
        <ul className="mt-1.5 flex flex-col gap-1 border-l border-line pl-3">
          {steps.map((s, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-4 text-soft"
            >
              <span>{s.label}</span>
              {typeof s.ms === "number" && (
                <span className="shrink-0 font-mono text-[10px] text-soft/70">
                  {s.ms} ms
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
