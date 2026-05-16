// real MongoDB Atlas. SERVER ONLY.
//
// one client, lazily connected, cached across HMR (the standard Next +
// Mongo pattern, otherwise dev reloads leak connections). graceful: if
// MONGODB_URI is unset the app still runs, the waitlist just reports
// "not configured" instead of crashing. minimal + real: a single
// collection, one upsert + one count. that is the whole integration.

import { MongoClient, type Db } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "bro";

declare global {
  // eslint-disable-next-line no-var
  var _broMongo: Promise<MongoClient> | undefined;
}

export function mongoConfigured(): boolean {
  return Boolean(URI);
}

export async function getDb(): Promise<Db | null> {
  if (!URI) return null;
  try {
    if (!globalThis._broMongo) {
      globalThis._broMongo = new MongoClient(URI, {
        serverSelectionTimeoutMS: 4000,
      }).connect();
    }
    const client = await globalThis._broMongo;
    return client.db(DB_NAME);
  } catch {
    // a failed connect must not poison the cached promise forever
    globalThis._broMongo = undefined;
    return null;
  }
}
