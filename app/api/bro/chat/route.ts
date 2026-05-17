// POST /api/bro/chat  { message, threadId? }
//
// the real Backboard-backed bro chat. one server call: Backboard (with
// the bro persona) for the reply, then best-effort persist the turn to
// MongoDB Atlas and grow the bro-owned graph from the conversation.
// every piece is real; jabby/gbrain are never touched. persistence and
// graph growth never block or break the reply.

import { askBroPersona, backboardConfigured } from "@/lib/backboard";
import { appendTurn } from "@/lib/threadStore";
import { ingest } from "@/lib/broGraph";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let message = "";
  let threadId: string | null = null;
  try {
    const body = (await request.json()) as {
      message?: unknown;
      threadId?: unknown;
    };
    message = String(body?.message ?? "").trim();
    threadId = body?.threadId ? String(body.threadId) : null;
  } catch {
    return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  if (!message) {
    return Response.json({ ok: false, error: "say something" }, { status: 400 });
  }
  if (message.length > 2000) {
    return Response.json(
      { ok: false, error: "keep it under 2000 chars" },
      { status: 400 },
    );
  }
  if (!backboardConfigured()) {
    return Response.json({
      ok: false,
      configured: false,
      reply:
        "bro's brain runs on Backboard, which isn't keyed in this build.",
      threadId: null,
    });
  }

  const t0 = Date.now();
  const r = await askBroPersona(message, threadId);
  const backboardMs = Date.now() - t0;

  if (!r.ok) {
    return Response.json({
      ok: false,
      configured: true,
      reply: "bro got cut off. try that again.",
      threadId: r.threadId,
    });
  }

  // persist + grow the graph, best-effort, after the reply is secured.
  // each returns whether it actually happened, so the trace is true.
  let persisted = false;
  let added = 0;
  if (r.threadId) {
    const [p, g] = await Promise.all([
      appendTurn(r.threadId, message, r.reply),
      ingest(`${message}\n${r.reply}`),
    ]);
    persisted = p;
    added = g.entities;
  }

  // the "what bro did" trace: only steps that genuinely happened.
  const steps: Array<{ label: string; ms?: number }> = [
    {
      label: threadId
        ? "continued the thread, Backboard memory on"
        : "opened a new Backboard thread",
    },
    { label: "asked the bro assistant on Backboard", ms: backboardMs },
  ];
  if (persisted) steps.push({ label: "saved the turn to MongoDB Atlas" });
  if (added > 0) {
    steps.push({
      label: `grew the knowledge graph, +${added} ${
        added === 1 ? "entity" : "entities"
      }`,
    });
  }

  return Response.json({
    ok: true,
    configured: true,
    reply: r.reply,
    threadId: r.threadId,
    steps,
  });
}
