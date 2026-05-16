"use client";

// the screen inside the iPhone: a real iMessage-style thread with bro.
// scripted opener for context (honest: it's bro introducing itself, not
// a faked capability), then every turn is a real call to our Backboard
// route. threadId is kept so it actually remembers. the on-screen
// keyboard is tappable AND the pill is a real input (hardware typing
// works too), same idea as Folk's hero, but ours actually talks back.

import { useRef, useState } from "react";

type Turn = { role: "bro" | "you"; text: string };

const OPENER: Turn[] = [
  { role: "bro", text: "yo. i'm bro." },
  { role: "bro", text: "i live in your texts and i remember everything. ask me something." },
];

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export function PhoneChat() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>(OPENER);
  const [busy, setBusy] = useState(false);
  const threadId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "you", text: msg }]);
    setBusy(true);
    scrollDown();
    try {
      const res = await fetch("/api/bro/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, threadId: threadId.current }),
      });
      const data = (await res.json()) as { reply?: string; threadId?: string | null };
      if (data.threadId) threadId.current = data.threadId;
      setTurns((t) => [...t, { role: "bro", text: data.reply || "bro got cut off. try again." }]);
    } catch {
      setTurns((t) => [...t, { role: "bro", text: "bro got cut off. try again." }]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  const tap = (k: string) => setInput((v) => v + k);
  const back = () => setInput((v) => v.slice(0, -1));

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* header (clears the Dynamic Island) */}
      <div className="flex items-center gap-2 border-b border-line/70 px-4 pb-2 pt-12">
        <span className="text-lg leading-none text-accent">‹</span>
        <div className="flex flex-1 flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-bg">
            <span className="bro-display text-base leading-none">b</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-ink">
            bro <span className="text-soft">›</span>
          </div>
        </div>
        <span className="text-soft" aria-hidden>
          ⌕
        </span>
      </div>

      {/* thread */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3"
      >
        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.role === "you" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-[18px] px-3.5 py-2 text-[13px] leading-snug ${
                t.role === "you"
                  ? "bg-accent text-bg"
                  : "bg-surface text-ink"
              }`}
            >
              {t.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-[18px] bg-surface px-4 py-2.5 text-[13px] text-soft">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* input pill */}
      <div className="flex items-center gap-2 px-3 pb-2 pt-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-soft">
          +
        </span>
        <div className="flex flex-1 items-center rounded-full border border-line bg-bg pl-3.5 pr-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="iMessage"
            aria-label="message bro"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-ink outline-none placeholder:text-soft/70"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="send"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg transition-opacity disabled:opacity-30"
          >
            ↑
          </button>
        </div>
      </div>

      {/* iOS-style keyboard, tappable, matcha-neutral */}
      <div className="select-none bg-surface/70 px-1.5 pb-2 pt-2">
        {ROWS.map((row, ri) => (
          <div key={ri} className="mb-1.5 flex justify-center gap-1">
            {ri === 2 && (
              <Key wide onClick={() => {}} label="⇧" />
            )}
            {row.map((k) => (
              <Key key={k} onClick={() => tap(k)} label={k} />
            ))}
            {ri === 2 && <Key wide onClick={back} label="⌫" />}
          </div>
        ))}
        <div className="flex justify-center gap-1">
          <Key wide onClick={() => {}} label="123" />
          <Key onClick={() => tap(" ")} label="space" grow />
          <Key wide onClick={send} label="return" />
        </div>
      </div>
    </div>
  );
}

function Key({
  label,
  onClick,
  wide = false,
  grow = false,
}: {
  label: string;
  onClick: () => void;
  wide?: boolean;
  grow?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-8 items-center justify-center rounded-[6px] bg-bg text-[12px] text-ink shadow-[0_1px_1.5px_rgba(35,36,31,0.16)] active:bg-line ${
        grow ? "flex-1" : wide ? "px-2.5" : "w-[26px]"
      }`}
    >
      {label}
    </button>
  );
}
