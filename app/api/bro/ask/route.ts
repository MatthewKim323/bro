// POST /api/bro/ask  { message, threadId? } -> a real Backboard reply.
// the browser talks to this route, never to Backboard directly, so the
// API key stays server-side. threadId is echoed back so the next turn
// continues the same remembered conversation.

import { askBro, backboardConfigured } from "@/lib/backboard";

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
    return Response.json(
      { ok: false, error: "say something" },
      { status: 400 },
    );
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
        "bro's brain runs on Backboard, which isn't wired up in this build. it's real, just not keyed here.",
      threadId: null,
    });
  }

  const result = await askBro(message, threadId);
  if (!result.ok) {
    return Response.json({
      ok: false,
      configured: true,
      reply: "bro got cut off. try that again.",
      threadId: result.threadId,
    });
  }
  return Response.json({
    ok: true,
    configured: true,
    reply: result.reply,
    threadId: result.threadId,
  });
}
