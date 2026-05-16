"use client";

// bro-local prefs/threads, backed by localStorage the right way:
// useSyncExternalStore, not a read-in-an-effect. that means no
// set-state-in-effect (no cascading renders), no hydration mismatch
// (the server snapshot is null/fallback, the client reconciles after
// hydrate), and cross-tab sync via the storage event for free.
//
// the SQLite-vs-JSON persistence decision is still phase 3 (§15 open
// #2); this is the small swappable seam, see BRO_PLAN.md §9.4.

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith("bro.")) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  for (const cb of listeners) cb();
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked/full: prefs are a view, not the brain. stay calm. */
  }
  emit();
}

/** a raw string key. null until set. setter is stable. */
export function useLocalString(
  key: string,
): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const set = useCallback((v: string | null) => writeRaw(key, v), [key]);
  return [value, set];
}

// parsed-JSON snapshots must be referentially stable across reads or
// useSyncExternalStore loops. cache the parse, keyed by the raw string.
const jsonCache = new Map<string, { raw: string; parsed: unknown }>();

/** a JSON-encoded key with a fallback. updater receives the current value. */
export function useLocalJSON<T>(
  key: string,
  fallback: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const getSnapshot = (): T => {
    const raw = readRaw(key);
    if (raw === null) return fallback;
    const hit = jsonCache.get(key);
    if (hit && hit.raw === raw) return hit.parsed as T;
    try {
      const parsed = JSON.parse(raw) as T;
      jsonCache.set(key, { raw, parsed });
      return parsed;
    } catch {
      return fallback;
    }
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeRaw(key, JSON.stringify(resolved));
    },
    // getSnapshot closes over key/fallback only; both are stable per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, set];
}
