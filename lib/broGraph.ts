// the chat-built knowledge graph, in MongoDB Atlas. SERVER ONLY.
//
// bro-owned and SEPARATE from jabby's gbrain by design: this never
// reads or writes gbrain, so chatting with bro can never pollute or
// touch jabby's real memory. honest framing: nodes are entities and
// topics that genuinely appeared in your conversations, edges are real
// co-occurrence (mentioned together). simple regex extraction, no NLP
// deps, labeled truthfully in the UI as "from your conversations".

import { getDb } from "@/lib/mongo";

const NODES = "bro_graph_nodes";
const EDGES = "bro_graph_edges";

// the mongodb driver defaults _id to ObjectId; ours are strings, so
// the collections must be typed for the build's typecheck to pass.
type NodeDoc = {
  _id: string;
  label: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
};
type EdgeDoc = {
  _id: string;
  a: string;
  b: string;
  weight: number;
  lastSeen: number;
};

const STOP = new Set([
  "the","a","an","i","you","he","she","it","we","they","this","that","these",
  "those","and","or","but","if","so","yo","ok","okay","hey","hi","yeah","nah",
  "what","who","when","where","why","how","is","are","was","were","be","been",
  "to","of","in","on","for","with","at","by","my","your","me","im","ill","its",
  "bro","jabby",
]);

export type GraphNode = { id: string; label: string; count: number };
export type GraphEdge = { a: string; b: string; weight: number };

// pull entity/topic candidates: $TICKERS, "quoted phrases", and
// Capitalized runs (proper-noun-ish). lowercased key, display kept.
function extract(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const add = (raw: string) => {
    const label = raw.trim().replace(/\s+/g, " ");
    if (label.length < 2 || label.length > 40) return;
    const key = label.toLowerCase();
    if (STOP.has(key)) return;
    if (/^\d+$/.test(key)) return;
    if (!out.has(key)) out.set(key, label);
  };
  for (const m of text.matchAll(/\$[A-Za-z]{2,8}\b/g)) add(m[0]);
  for (const m of text.matchAll(/"([^"]{2,40})"/g)) add(m[1]);
  for (const m of text.matchAll(
    /\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})\b/g,
  ))
    add(m[1]);
  return new Map([...out].slice(0, 8));
}

/**
 * ingest a chunk of conversation text. never throws. returns how many
 * entities it actually recorded this turn so the trace can say the
 * truth (0 means nothing was written, the trace then claims nothing).
 */
export async function ingest(text: string): Promise<{ entities: number }> {
  try {
    const db = await getDb();
    if (!db) return { entities: 0 };
    const found = extract(text);
    if (found.size === 0) return { entities: 0 };
    const now = Date.now();
    const entries = [...found.entries()];

    await Promise.all(
      entries.map(([key, label]) =>
        db.collection<NodeDoc>(NODES).updateOne(
          { _id: key },
          {
            // _id comes from the filter on upsert; do not set it here
            $setOnInsert: { label, firstSeen: now },
            $set: { lastSeen: now },
            $inc: { count: 1 },
          },
          { upsert: true },
        ),
      ),
    );

    const keys = entries.map(([k]) => k).sort();
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) pairs.push([keys[i], keys[j]]);

    await Promise.all(
      pairs.map(([a, b]) =>
        db.collection<EdgeDoc>(EDGES).updateOne(
          { _id: `${a}${b}` },
          {
            $setOnInsert: { a, b },
            $set: { lastSeen: now },
            $inc: { weight: 1 },
          },
          { upsert: true },
        ),
      ),
    );
    return { entities: entries.length };
  } catch {
    /* graph growth is best-effort; chat must never break on it */
    return { entities: 0 };
  }
}

export async function getGraph(limit = 80): Promise<{
  ok: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  try {
    const db = await getDb();
    if (!db) return { ok: false, nodes: [], edges: [] };
    const nodeDocs = await db
      .collection<NodeDoc>(NODES)
      .find({})
      .sort({ count: -1 })
      .limit(limit)
      .toArray();
    const nodes: GraphNode[] = nodeDocs.map((n) => ({
      id: String(n._id),
      label: String(n.label ?? n._id),
      count: Number(n.count ?? 1),
    }));
    const live = new Set(nodes.map((n) => n.id));
    const edgeDocs = await db.collection<EdgeDoc>(EDGES).find({}).toArray();
    const edges: GraphEdge[] = edgeDocs
      .filter((e) => live.has(String(e.a)) && live.has(String(e.b)))
      .map((e) => ({
        a: String(e.a),
        b: String(e.b),
        weight: Number(e.weight ?? 1),
      }));
    return { ok: true, nodes, edges };
  } catch {
    return { ok: false, nodes: [], edges: [] };
  }
}
