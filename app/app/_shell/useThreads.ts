"use client";

// bro-owned threads. a thread is purely YOUR view: a title + timestamps
// (messages join in phase 3). jabby stays one continuous gbrain-backed
// brain underneath, threads never bound its memory. see BRO_PLAN.md
// §8.1 / §9.4.
//
// persistence rides useLocalStore (useSyncExternalStore, not a mount
// effect). the SQLite-vs-JSON decision is still phase 3 (§15 open #2);
// this layer stays small and swappable.

import { useCallback } from "react";
import { useLocalJSON, useLocalString } from "./useLocalStore";

export type Thread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

const KEY = "bro.threads.v1";
const ACTIVE_KEY = "bro.threads.active.v1";
const EMPTY: Thread[] = [];

export function useThreads() {
  const [threads, setThreads] = useLocalJSON<Thread[]>(KEY, EMPTY);
  const [activeId, setActiveId] = useLocalString(ACTIVE_KEY);

  const select = useCallback(
    (id: string | null) => setActiveId(id),
    [setActiveId],
  );

  const newThread = useCallback((): Thread => {
    const now = Date.now();
    const t: Thread = {
      id: `t_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      // auto-title is decided in phase 3 (cheap local heuristic vs a jabby
      // call, §15 open #4). until then a calm placeholder, never blank.
      title: "new thread",
      createdAt: now,
      updatedAt: now,
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    return t;
  }, [setThreads, setActiveId]);

  const remove = useCallback(
    (id: string) => {
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [setThreads, setActiveId, activeId],
  );

  return { threads, activeId, newThread, select, remove };
}

/** today / earlier grouping for the sidebar. newest first within a group. */
export function groupThreads(threads: Thread[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff = startOfToday.getTime();
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  return {
    today: sorted.filter((t) => t.updatedAt >= cutoff),
    earlier: sorted.filter((t) => t.updatedAt < cutoff),
  };
}
