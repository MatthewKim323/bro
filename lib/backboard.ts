// real Backboard.io call. SERVER ONLY.
//
// POST https://app.backboard.io/api/threads/messages with X-API-Key.
// thread + assistant are auto-created on the first call; we pass the
// returned thread_id back on follow-ups so the conversation actually
// remembers, which is precisely the stateful-memory capability the
// Backboard track rewards. minimal (one endpoint) and fully real.
//
// graceful: no key -> the landing demo shows an honest "offline" state
// instead of throwing. the API key never reaches the browser.

const BASE = "https://app.backboard.io/api";
const KEY = process.env.BACKBOARD_API_KEY;

export function backboardConfigured(): boolean {
  return Boolean(KEY);
}

export type BroReply = {
  ok: boolean;
  configured: boolean;
  reply: string;
  threadId: string | null;
};

export async function askBro(
  content: string,
  threadId?: string | null,
): Promise<BroReply> {
  if (!KEY) {
    return { ok: false, configured: false, reply: "", threadId: null };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${BASE}/threads/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": KEY },
      body: JSON.stringify({
        content,
        stream: false,
        ...(threadId ? { thread_id: threadId } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, configured: true, reply: "", threadId: threadId ?? null };
    }
    const json = (await res.json()) as {
      content?: string;
      thread_id?: string;
    };
    return {
      ok: true,
      configured: true,
      reply: String(json?.content ?? ""),
      threadId: json?.thread_id ?? threadId ?? null,
    };
  } catch {
    return { ok: false, configured: true, reply: "", threadId: threadId ?? null };
  }
}
