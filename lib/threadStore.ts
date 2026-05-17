// chat history in MongoDB Atlas. SERVER ONLY. bro-owned, never touches
// jabby or gbrain. one collection: bro_threads, one doc per thread with
// an embedded messages array. defensive: if Mongo is down the chat
// still works, history just is not durable that turn (honest, no crash).

import { getDb } from "@/lib/mongo";

const COLLECTION = "bro_threads";

export type ChatRole = "you" | "bro";
export type ChatMsg = { role: ChatRole; text: string; ts: number };
export type ChatThread = {
  _id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMsg[];
};

function title(from: string): string {
  const t = from.trim().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 47) + "…" : t || "new chat";
}

/** append a user+bro turn to a thread (created on first turn). never throws. */
export async function appendTurn(
  threadId: string,
  userText: string,
  broText: string,
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const now = Date.now();
    await db.collection<ChatThread>(COLLECTION).updateOne(
      { _id: threadId },
      {
        $setOnInsert: { _id: threadId, createdAt: now, title: title(userText) },
        $set: { updatedAt: now },
        $push: {
          messages: {
            $each: [
              { role: "you", text: userText, ts: now },
              { role: "bro", text: broText, ts: now + 1 },
            ],
          },
        },
      },
      { upsert: true },
    );
  } catch {
    /* history is best-effort; the live chat must never break on it */
  }
}

export async function getThread(threadId: string): Promise<ChatThread | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    return await db
      .collection<ChatThread>(COLLECTION)
      .findOne({ _id: threadId });
  } catch {
    return null;
  }
}

export async function listThreads(limit = 30): Promise<
  Array<{ id: string; title: string; updatedAt: number; turns: number }>
> {
  try {
    const db = await getDb();
    if (!db) return [];
    const docs = await db
      .collection<ChatThread>(COLLECTION)
      .find({}, { projection: { title: 1, updatedAt: 1, messages: 1 } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => ({
      id: d._id,
      title: d.title,
      updatedAt: d.updatedAt,
      turns: Math.floor((d.messages?.length ?? 0) / 2),
    }));
  } catch {
    return [];
  }
}
