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
// (it resolves the jabby URL and spawns localhost fetches). not enforced
// by the `server-only` package yet to keep deps lean; enforce later.
//
// RELIABILITY: jabby's web server is pinned in its settings.json to
// 127.0.0.1:4632, but jabby's startWebWithFallback will silently bind
// 4633+ if 4632 is busy at boot. it records the REAL host/port it chose
// in its state.json. so bro resolves the base URL as:
//   1. JABBY_URL env  (explicit override: a tunnel, a remote, testing)
//   2. jabby's state.json .web {host,port}  (self-heals port drift)
//   3. http://127.0.0.1:4632  (the pinned default)
// resolution is cached for 5s so drift recovers within one poll cycle
// without a bro restart, and the FS is not touched per request.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_BASE = "http://127.0.0.1:4632";
const STATE_FILE =
  process.env.JABBY_STATE_FILE ||
  join(homedir(), "Documents", "jabby", ".claude", "jabby", "state.json");

let baseCache: { url: string; exp: number } | null = null;

function jabbyBase(): string {
  const env = process.env.JABBY_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const now = Date.now();
  if (baseCache && baseCache.exp > now) return baseCache.url;
  let url = DEFAULT_BASE;
  try {
    const web = JSON.parse(readFileSync(STATE_FILE, "utf8"))?.web;
    if (web && web.enabled !== false && web.host && web.port) {
      url = `http://${web.host}:${web.port}`;
    }
  } catch {
    // no state file / unreadable / malformed: fall back to the pinned
    // default. a real outage then shows honestly via the status poller.
  }
  baseCache = { url, exp: now + 5000 };
  return url;
}

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
    return await fetch(`${jabbyBase()}${path}`, {
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
    const res = await fetch(`${jabbyBase()}/api/chat`, {
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
