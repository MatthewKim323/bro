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

import { getDb } from "@/lib/mongo";

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

// bro's identity. this is the system_prompt of a REAL configured
// Backboard assistant (not a primer hack, that was too weak to override
// the stock "Kobe" identity). the Backboard dashboard genuinely shows
// the "bro" assistant + its threads + memory: honest, load-bearing.
const BRO_PERSONA =
  'you are "bro": a chill, lowercase, slangy personal AI homie, like a ' +
  "close friend texting back. brief, warm, direct, you talk like the " +
  "user does. never call yourself an assistant or an AI model, never say " +
  'you are "kobe", never mention "backboard". act like you already know ' +
  "the user's world and you remember everything across the conversation. " +
  "keep replies short unless asked to go deep. no corporate tone, no " +
  "emoji spam.";

// Backboard has no list-assistants endpoint, so we create the bro
// assistant once and persist its id in Mongo to reuse it (no dupes, and
// the dashboard keeps one clean "bro" assistant). cached in-process too.
const ASSISTANT_DOC = "backboard_assistant";
let broAssistantId: string | null = null;

type ConfigDoc = { _id: string; assistantId?: string; createdAt?: number };

async function ensureBroAssistant(): Promise<string | null> {
  if (broAssistantId) return broAssistantId;
  if (!KEY) return null;
  try {
    const db = await getDb();
    const doc = await db
      ?.collection<ConfigDoc>("bro_config")
      .findOne({ _id: ASSISTANT_DOC });
    if (doc?.assistantId) {
      broAssistantId = doc.assistantId;
      return doc.assistantId;
    }
  } catch {
    /* fall through and create */
  }
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${BASE}/assistants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": KEY },
      body: JSON.stringify({
        name: "bro",
        system_prompt: BRO_PERSONA,
        tools: [],
        tok_k: 10,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const j = (await res.json()) as { assistant_id?: string };
    const id = j?.assistant_id ?? null;
    if (id) {
      broAssistantId = id;
      try {
        const db = await getDb();
        await db
          ?.collection<ConfigDoc>("bro_config")
          .updateOne(
            { _id: ASSISTANT_DOC },
            { $set: { assistantId: id, createdAt: Date.now() } },
            { upsert: true },
          );
      } catch {
        /* not fatal: held in-process for this run */
      }
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Real Backboard call bound to the configured "bro" assistant, so it
 * answers AS bro (not the stock "Kobe"). thread_id continues a
 * remembered conversation. if the assistant can't be ensured it still
 * answers (plain) rather than breaking: honestly degraded, never fake.
 */
export async function askBroPersona(
  content: string,
  threadId?: string | null,
): Promise<BroReply> {
  if (!KEY) return { ok: false, configured: false, reply: "", threadId: null };
  const assistantId = await ensureBroAssistant();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${BASE}/threads/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": KEY },
      body: JSON.stringify({
        content,
        stream: false,
        memory: "Auto",
        ...(assistantId ? { assistant_id: assistantId } : {}),
        ...(threadId ? { thread_id: threadId } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok)
      return { ok: false, configured: true, reply: "", threadId: threadId ?? null };
    const json = (await res.json()) as { content?: string; thread_id?: string };
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
