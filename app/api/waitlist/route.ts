// the waitlist. POST an email -> real write to MongoDB Atlas.
// GET -> the real signup count. graceful when Mongo is not configured
// so the landing still runs locally without secrets.

import { getDb, mongoConfigured } from "@/lib/mongo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLLECTION = "waitlist";

export async function GET() {
  const db = await getDb();
  if (!db) {
    return Response.json({ ok: true, configured: mongoConfigured(), count: 0 });
  }
  const count = await db.collection(COLLECTION).countDocuments();
  return Response.json({ ok: true, configured: true, count });
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: "enter a valid email" },
      { status: 400 },
    );
  }

  const db = await getDb();
  if (!db) {
    // honest: nothing was stored, say so rather than fake a success
    return Response.json({
      ok: false,
      configured: false,
      error: "waitlist storage is not configured yet",
    });
  }

  // upsert so the same email twice is idempotent, not a duplicate
  await db
    .collection(COLLECTION)
    .updateOne(
      { email },
      { $setOnInsert: { email, ts: new Date() } },
      { upsert: true },
    );
  const count = await db.collection(COLLECTION).countDocuments();
  return Response.json({ ok: true, configured: true, count });
}
