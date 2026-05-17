"use client";

// the screen inside the iPhone: a SCRIPTED demo thread, deliberately
// NOT wired to any backend (Folk's hero phone is a scripted demo too).
// it shows what bro is in bro's voice; the real bro (jabby + gbrain,
// and Backboard) lives in the product, not this marketing eye-candy.
// no network, no keys, works identically on the deployed build.
// the on-screen keyboard is tappable and the pill is a real input.

import { useEffect, useRef, useState } from "react";

type Turn = { role: "bro" | "you"; text: string };

const OPENER: Turn[] = [
  { role: "bro", text: "yo. i'm bro." },
  { role: "bro", text: "i live in your texts and i remember everything. say something." },
];

// a guided showcase: bro advances through these as you send, regardless
// of the exact message (a demo, like Folk's). every line is true to
// what bro actually does, just canned for the landing.
const SCRIPT: string[] = [
  "i already know your world. the people, the threads, what actually matters. i don't start from zero.",
  "tell me to remember something and it sticks. across every chat, forever.",
  "i run on my own too. check-ins, nudges, watching the stuff you care about. no prompt needed.",
  "i'll even paper-trade solana memecoins when you say go. real prices, fake wallet, zero risk.",
  "this is just a taste. the real me lives in your discord, telegram, and the app. tap get bro.",
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
  const step = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function scrollDown() {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // scripted, local, no fetch. user message in, the next showcase line
  // out after a believable typing beat.
  function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "you", text: msg }]);
    setBusy(true);
    scrollDown();
    const reply = SCRIPT[Math.min(step.current, SCRIPT.length - 1)];
    step.current += 1;
    timer.current = setTimeout(
      () => {
        setTurns((t) => [...t, { role: "bro", text: reply }]);
        setBusy(false);
        scrollDown();
      },
      750 + Math.random() * 500,
    );
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
