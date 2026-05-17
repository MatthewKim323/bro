"use client";

// one tiny in-memory signal: has the landing preloader handed off yet.
// the hero's entrance (the "bro." slide, the reveal cascade, the phone)
// used to play on mount, hidden behind the opaque curtain, so it was
// already finished when the curtain lifted. the hero now waits on this
// so the entrance actually plays for the viewer (through the dissolving
// curtain). in-memory on purpose: a fresh load always re-runs it. same
// pattern as the shell's activity store.

import { useSyncExternalStore } from "react";

let done = false;
const listeners = new Set<() => void>();

export function markLoaderDone() {
  if (done) return;
  done = true;
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** has the preloader started handing off to the hero. */
export function useLoaderDone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => done,
    () => false,
  );
}
