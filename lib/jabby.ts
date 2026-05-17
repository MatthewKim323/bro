// the typed client for jabby's web contract (BRO_PLAN.md §9.2, verified
// against ~/Documents/jabby/src/ui/server.ts). server-side only: bro's
// route handlers call this, the browser never reaches jabby directly.
//
// jabby's web server is opt-in and may be off. every call here is
// defensive: a short timeout, no throw on a dead daemon. the status
// system reads truth from these, it must never get a hang or a crash.
//
// phase 2 implements health + state (the connection poller). chat / logs
// / jobs / settings land in their own phases against this same module.
//
// SERVER ONLY. import this from route handlers, never a client component
// (it reads JABBY_URL and spawns localhost fetches). not enforced by the
// `server-only` package yet to keep deps lean; enforce when chat lands.

const JABBY_URL = process.env.JABBY_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4632";

const DEFAULT_TIMEOUT_MS = 2500;

export type JabbyHealth = { ok: boolean; now: number };

// shape of jabby's /api/state (buildState in jabby's services/state.ts)
export type JabbyState = {
  daemon: { running: boolean; pid: number; startedAt: number; uptimeMs: number };
  heartbeat: {
    enabled: boolean;
    intervalMinutes: number;
    nextAt: number | null;
    nextInMs: number | null;
  };
  jobs: Array<{ name: string; schedule: string; prompt: string }>;
  security: { level: string; allowedTools: string[]; disallowedTools: string[] };
  telegram: { configured: boolean; allowedUserCount: number };
  discord: { configured: boolean; allowedUserCount: number };
  session: {
    sessionIdShort: string;
    createdAt: number;
    lastUsedAt: number;
  } | null;
  web: { enabled: boolean; host: string; port: number };
};

async function jabbyFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    init?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    return await fetch(`${JABBY_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** is jabby's web server alive right now. never throws. */
export async function getHealth(): Promise<JabbyHealth> {
  try {
    const res = await jabbyFetch("/api/health");
    if (!res.ok) return { ok: false, now: Date.now() };
    const body = (await res.json()) as Partial<JabbyHealth>;
    return { ok: Boolean(body.ok), now: body.now ?? Date.now() };
  } catch {
    return { ok: false, now: Date.now() };
  }
}

/** daemon snapshot for the activity panel + status detail. null if unreachable. */
export async function getState(): Promise<JabbyState | null> {
  try {
    const res = await jabbyFetch("/api/state");
    if (!res.ok) return null;
    return (await res.json()) as JabbyState;
  } catch {
    return null;
  }
}

export type JabbyChat =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; message: string };

const CHAT_CONNECT_TIMEOUT_MS = 8000;

// open jabby's /api/chat and hand back the raw SSE body. the connect is
// bounded (a dead daemon fails fast and calmly) but the STREAM is not:
// once headers arrive we clear the timeout so a long reply can flow for
// as long as jabby needs. jabby is stateless here, one message in, a
// stream out, no session id (BRO_PLAN.md §8.1 / §9.2).
export async function chat(message: string): Promise<JabbyChat> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CHAT_CONNECT_TIMEOUT_MS,
  );
  try {
    const res = await fetch(`${JABBY_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok || !res.body) {
      return {
        ok: false,
        message:
          "bro could not reach jabby just now. is jabby's web server on?",
      };
    }
    return { ok: true, stream: res.body };
  } catch {
    clearTimeout(timeout);
    return {
      ok: false,
      message:
        "bro could not reach jabby just now. is jabby's web server on?",
    };
  }
}
