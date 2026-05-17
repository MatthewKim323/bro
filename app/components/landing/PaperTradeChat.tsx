"use client";

// bubbles only (no phone frame): a sample of how bro watches a Solana
// mover and reports back. honest to the plan: paper wallet, real
// observed prices, bro checks in on its own. lowercase bro voice. it
// plays out like a real thread (you sends, bro types, bro replies) the
// first time it scrolls into view. reduced motion: show it all at once.

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Turn = { role: "bro" | "you"; text: string };

const THREAD: Turn[] = [
  { role: "you", text: "yo bro, have you heard of $opal? looks bullish" },
  { role: "bro", text: "yup, already on it. volume's picking up, chart's still choppy though." },
  { role: "bro", text: "i'll watch it and message you when the timing's good to buy. paper wallet, real prices." },
  { role: "you", text: "lfg" },
  { role: "bro", text: "tracked. you'll hear from me the moment it sets up." },
];

const BRO_EASE = [0.22, 1, 0.36, 1] as const;

export function PaperTradeChat() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setShown(THREAD.length);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const run = () => {
      // calm ~2s cadence per message. bro shows the typing bubble for
      // the latter ~1.4s before each reply; "lfg" gets an extra beat.
      let t = 700;
      THREAD.forEach((turn, i) => {
        if (turn.role === "bro") {
          timers.current.push(
            setTimeout(() => setTyping(true), t + 600),
          );
          timers.current.push(
            setTimeout(() => {
              setTyping(false);
              setShown(i + 1);
            }, t + 2000),
          );
          t += 2000;
        } else {
          const beat = turn.text === "lfg" ? 700 : 0;
          timers.current.push(
            setTimeout(() => setShown(i + 1), t + beat),
          );
          t += 2000 + beat;
        }
      });
    };

    const reset = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setTyping(false);
      setShown(0);
    };

    const io = new IntersectionObserver(
      (entries) => {
        // restart the thread every time it scrolls into view, wipe it
        // when it leaves so the next entry plays fresh.
        if (entries[0].isIntersecting) {
          reset();
          run();
        } else {
          reset();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex w-full max-w-sm flex-col">
      {THREAD.slice(0, shown).map((tn, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: BRO_EASE }}
          className={`flex ${tn.role === "you" ? "justify-end" : "justify-start"} ${
            i === 0 ? "" : THREAD[i - 1].role === tn.role ? "mt-1" : "mt-4"
          }`}
        >
          <div
            className={`max-w-[78%] rounded-[18px] px-3.5 py-2 text-[13px] leading-snug ${
              tn.role === "you"
                ? "bg-accent text-bg"
                : "bg-surface text-ink"
            }`}
          >
            {tn.text}
          </div>
        </motion.div>
      ))}
      {typing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: BRO_EASE }}
          className={`flex origin-bottom-left justify-start ${
            shown > 0 && THREAD[shown - 1].role === "bro" ? "mt-1" : "mt-4"
          }`}
        >
          <div className="rounded-[18px] bg-surface px-4 py-2.5">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soft [animation-delay:300ms]" />
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
