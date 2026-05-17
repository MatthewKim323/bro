"use client";

// bro-owned threads. a thread is purely YOUR view: a title, timestamps,
// and an ordered transcript. jabby stays one continuous gbrain-backed
// brain underneath, so threads never bound its memory, they only slice
// how you read the conversation. see BRO_PLAN.md §8.1 / §9.4.
//
// persistence rides useLocalStore (useSyncExternalStore, not a mount
// effect). only SETTLED messages are persisted here; an in-flight
// streaming reply lives in the chat component and is appended on
// done/error. that keeps token streaming off localStorage (no
// stringify-per-token jank) and matches the SSE-drop rule (a reload
// mid-stream just drops the partial, it never corrupts a thread).
// SQLite-vs-JSON is still phase 3's call (§15 open #2); this stays the
// small swappable seam.

import { useCallback } from "react";
import { useLocalJSON, useLocalString } from "./useLocalStore";
import type { TraceStep } from "@/app/components/Trace";

export type { TraceStep };

export type Role = "user" | "bro";

export type MsgStatus = "done" | "error" | "cut";

export type Message = {
  id: string;
  role: Role;
  text: string;
  ts: number;
  trace?: TraceStep[];
  status?: MsgStatus;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
};

const KEY = "bro.threads.v2";
const ACTIVE_KEY = "bro.threads.active.v1";
const EMPTY: Thread[] = [];

const DEFAULT_TITLE = "new thread";

// cheap local auto-title (§15 open #4: heuristic over a jabby call, so
// it stays instant and free). first line, trimmed, ~6 words / 48 chars.
function deriveTitle(message: string): string {
  const firstLine = message.trim().split("\n")[0].trim();
  if (!firstLine) return DEFAULT_TITLE;
  const words = firstLine.split(/\s+/).slice(0, 6).join(" ");
  const t = words.length > 48 ? `${words.slice(0, 47)}…` : words;
  return t.toLowerCase();
}

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
      title: DEFAULT_TITLE,
      createdAt: now,
      updatedAt: now,
      messages: [],
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

  // append a settled message. auto-titles the thread from the first user
  // message if it is still the default. bumps updatedAt so the sidebar
  // re-sorts. creates the thread row if it does not exist yet.
  const appendMessage = useCallback(
    (threadId: string, msg: Message) => {
      setThreads((prev) => {
        const now = Date.now();
        const exists = prev.some((t) => t.id === threadId);
        const base: Thread[] = exists
          ? prev
          : [
              {
                id: threadId,
                title: DEFAULT_TITLE,
                createdAt: now,
                updatedAt: now,
                messages: [],
              },
              ...prev,
            ];
        return base.map((t) => {
          if (t.id !== threadId) return t;
          const retitle =
            t.title === DEFAULT_TITLE && msg.role === "user" && msg.text.trim();
          return {
            ...t,
            title: retitle ? deriveTitle(msg.text) : t.title,
            updatedAt: now,
            messages: [...t.messages, msg],
          };
        });
      });
    },
    [setThreads],
  );

  return {
    threads,
    activeId,
    newThread,
    select,
    remove,
    appendMessage,
  };
}

/** find a thread by id (read-only helper for the chat panel). */
export function findThread(threads: Thread[], id: string | null) {
  if (!id) return null;
  return threads.find((t) => t.id === id) ?? null;
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
