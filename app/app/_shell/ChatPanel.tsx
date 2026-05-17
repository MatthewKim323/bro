"use client";

// chat: the heart (BRO_PLAN.md §8.1). chatgpt-familiar, quieter. you
// talk, bro streams back token by token, ink on cream, no bubble. your
// message is a quiet surface chip. under each bro reply, a collapsed
// "what bro did" trace built from real SSE timing (never invented).
//
// threads are YOUR view; jabby is one continuous brain underneath, so
// every message posts to the same stateless /api/chat. bro owns the
// transcript locally. settled messages persist; the in-flight reply
// lives here until done/error, then it is appended (matches the
// SSE-drop rule: a mid-stream reload drops the partial, never corrupts
// a thread).

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamingText } from "@/app/components/StreamingText";
import { Trace } from "@/app/components/Trace";
import { Label } from "@/app/components/Label";
import {
  useThreads,
  findThread,
  type Message,
  type TraceStep,
} from "./useThreads";
import { setBroBusy } from "./activity";

type Phase = "idle" | "waiting" | "streaming";

type Live = {
  threadId: string;
  text: string;
  steps: TraceStep[];
  phase: Phase;
};

function newId(p: string) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function ChatPanel() {
  const { threads, activeId, newThread, appendMessage } = useThreads();
  const thread = findThread(threads, activeId);
  const messages = thread?.messages ?? [];

  const [input, setInput] = useState("");
  const [live, setLive] = useState<Live | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState<string | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sending = live !== null;

  // keep the latest turn in view while it streams (and right after send)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, live?.text, live?.phase, errorMsg]);

  // textarea grows to ~6 lines then scrolls
  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }

  const runStream = useCallback(
    async (threadId: string, message: string) => {
      setErrorMsg(null);
      setLastUserText(message);
      setBroBusy(true);
      const t0 = performance.now();
      const steps: TraceStep[] = [];
      setLive({ threadId, text: "", steps, phase: "waiting" });

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const settle = (msg: Message) => {
        appendMessage(threadId, msg);
        setLive(null);
        setBroBusy(false);
        abortRef.current = null;
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: ctrl.signal,
        });
        if (!res.body) throw new Error("no stream");

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let acc = "";
        let firstToken = false;
        let finished = false;

        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });

          const blocks = buf.split("\n\n");
          buf = blocks.pop() ?? "";
          for (const block of blocks) {
            const line = block
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!line) continue;
            let evt: { type?: string; text?: string; message?: string };
            try {
              evt = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }

            if (evt.type === "chunk") {
              if (!firstToken) {
                firstToken = true;
                steps.push({
                  label: "started replying",
                  detail: `${Math.round(performance.now() - t0)}ms to first word`,
                });
              }
              acc += evt.text ?? "";
              setLive({
                threadId,
                text: acc,
                steps: [...steps],
                phase: "streaming",
              });
            } else if (evt.type === "unblock") {
              steps.push({
                label: "unblocked",
                detail: "bro freed the turn, kept working",
              });
              setLive({
                threadId,
                text: acc,
                steps: [...steps],
                phase: "streaming",
              });
            } else if (evt.type === "error") {
              finished = true;
              const human =
                evt.message ||
                "bro hit a snag mid-thought. try that again.";
              settle({
                id: newId("m"),
                role: "bro",
                text: acc,
                ts: Date.now(),
                trace: steps,
                status: "error",
              });
              setErrorMsg(human);
              return;
            } else if (evt.type === "done") {
              finished = true;
              steps.push({
                label: "done",
                detail: `${Math.round(performance.now() - t0)}ms total`,
              });
              settle({
                id: newId("m"),
                role: "bro",
                text: acc,
                ts: Date.now(),
                trace: steps,
                status: "done",
              });
              return;
            }
          }
        }

        // stream ended with no explicit done: keep the partial, mark cut
        settle({
          id: newId("m"),
          role: "bro",
          text: acc,
          ts: Date.now(),
          trace: steps,
          status: "cut",
        });
        if (!acc) setErrorMsg("bro got cut off. ask again.");
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        setLive(null);
        setBroBusy(false);
        abortRef.current = null;
        if (!aborted) setErrorMsg("bro got cut off. ask again.");
      }
    },
    [appendMessage],
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    const threadId = activeId ?? newThread().id;
    appendMessage(threadId, {
      id: newId("m"),
      role: "user",
      text,
      ts: Date.now(),
    });
    setInput("");
    requestAnimationFrame(autosize);
    void runStream(threadId, text);
  }, [input, sending, activeId, newThread, appendMessage, runStream]);

  const retry = useCallback(() => {
    if (!lastUserText || sending) return;
    const threadId = activeId ?? newThread().id;
    void runStream(threadId, lastUserText);
  }, [lastUserText, sending, activeId, newThread, runStream]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  const empty = messages.length === 0 && !live && !errorMsg;
  const liveForThread = live && (!activeId || live.threadId === activeId);

  // a textarea + a button: cheap enough to rebuild each render, and
  // memoizing it just fought the deps lint for no real gain.
  const composer = (
    <div className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="talk to bro..."
            className="max-h-[168px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-soft"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-bro bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
          >
            send
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-[11px] text-soft">
          ⌘↵ to send · jabby remembers across every thread
        </div>
      </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-7 px-6 py-10">
          {empty && (
            <div className="pt-[14vh] text-center">
              <Label className="mb-4 block">chat</Label>
              <p className="bro-display text-2xl leading-snug text-ink">
                this is where you talk to bro.
              </p>
              <p className="mt-3 text-sm text-soft">
                it knows your world and remembers across every thread.
              </p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-bro bg-surface px-4 py-2.5 text-[16px] leading-relaxed text-ink">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id}>
                <StreamingText text={m.text} />
                {m.status === "cut" && (
                  <p className="mt-1 text-[12px] text-soft">
                    bro got cut off here.
                  </p>
                )}
                {m.trace && <Trace steps={m.trace} />}
              </div>
            ),
          )}

          {liveForThread && (
            <div>
              {live.phase === "waiting" ? (
                <div className="flex items-center gap-2 text-soft">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent" />
                  <span className="bro-label">thinking</span>
                </div>
              ) : (
                <>
                  <StreamingText text={live.text} streaming />
                  {live.steps.length > 0 && <Trace steps={live.steps} />}
                </>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-bro border border-line bg-surface/50 px-4 py-3">
              <p className="text-[15px] text-ink">{errorMsg}</p>
              {lastUserText && (
                <button
                  type="button"
                  onClick={retry}
                  className="mt-2 text-[13px] text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  retry
                </button>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {composer}
    </div>
  );
}
