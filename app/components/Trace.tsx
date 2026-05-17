"use client";

// the "what bro did" disclosure. collapsed by default (UX rule 2,
// progressive disclosure): one quiet line under a bro message. click to
// expand a calm vertical list of what actually happened.
//
// honest by construction: jabby's SSE only gives us chunks + one
// unblock, so the steps shown here are real and derived (queued, time
// to first token, unblocked, done timing). bro never invents a "ran a
// gbrain query" step it cannot prove (truthful copy). no steps -> the
// disclosure does not render at all. see BRO_PLAN.md §8.1.

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export type TraceStep = { label: string; detail?: string };

export function Trace({ steps }: { steps: TraceStep[] }) {
  const [open, setOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] text-soft transition-colors hover:text-ink"
        aria-expanded={open}
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path
            d="M3 1.5l3 3-3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="uppercase tracking-[0.16em]">
          what bro did · {steps.length} step{steps.length === 1 ? "" : "s"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-2 border-l border-line pl-4">
              {steps.map((s, i) => (
                <li key={i} className="list-none text-[13px] leading-relaxed">
                  <span className="text-ink">{s.label}</span>
                  {s.detail && (
                    <span className="text-soft"> · {s.detail}</span>
                  )}
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
