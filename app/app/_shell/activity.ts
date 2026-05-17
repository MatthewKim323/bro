"use client";

// the shell needs to know when bro is mid-thought so the status bar can
// say "thinking" (UX rule 5, the single liveness truth). the chat panel
// owns that fact; the status bar lives up in the shell. one tiny
// in-memory store bridges them, no library (the plan says add state
// only when a panel proves it needs it, §11, and this one does).
//
// in-memory on purpose: "thinking" is live, not persisted. it resets on
// reload, which is correct, a fresh load is never mid-stream.

import { useSyncExternalStore } from "react";

let busy = false;
const listeners = new Set<() => void>();

export function setBroBusy(v: boolean) {
  if (busy === v) return;
  busy = v;
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** is bro working on a reply right now. */
export function useBroBusy(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => busy,
    () => false,
  );
}
