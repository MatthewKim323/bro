"use client";

// the single source of truth for "is this alive" (UX rule 5). polls
// bro's own /api/health (+ /api/state for detail), never jabby directly.
// it never lies and it never hangs: a dead daemon resolves to "offline",
// a wobble to "reconnecting", and it retries faster while unhealthy.
//
// "thinking" is reserved here and will be driven by an active chat SSE
// stream in phase 3. phase 2 only ever reports connecting / connected /
// reconnecting / offline, which is the honest set for a shell with no
// chat yet. see BRO_PLAN.md §9.5.

import { useEffect, useRef, useState } from "react";
import type { JabbyState } from "@/lib/jabby";

export type ConnStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "thinking";

const OK_INTERVAL = 5000;
const RETRY_INTERVAL = 3000;
const FAILS_BEFORE_OFFLINE = 3;

export function useConnection() {
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [state, setState] = useState<JabbyState | null>(null);
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const fails = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    async function poll() {
      let ok = false;
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const body = (await res.json()) as { ok?: boolean };
        ok = Boolean(body.ok);
      } catch {
        ok = false;
      }
      if (!alive.current) return;

      if (ok) {
        fails.current = 0;
        setStatus("connected");
        setLastOkAt(Date.now());
        // detail is best-effort; never blocks the dot
        fetch("/api/state", { cache: "no-store" })
          .then((r) => r.json())
          .then((b: { state: JabbyState | null }) => {
            if (alive.current) setState(b.state ?? null);
          })
          .catch(() => {});
      } else {
        fails.current += 1;
        setState(null);
        setStatus(
          fails.current >= FAILS_BEFORE_OFFLINE ? "offline" : "reconnecting",
        );
      }

      if (!alive.current) return;
      timer.current = setTimeout(poll, ok ? OK_INTERVAL : RETRY_INTERVAL);
    }

    poll();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (timer.current) clearTimeout(timer.current);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { status, state, lastOkAt };
}
