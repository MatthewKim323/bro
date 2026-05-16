"use client";

// ⌘K, the universal entry point (UX rule 4 made real). fuzzy over every
// real action the shell can do today: start a thread, jump to any panel.
// deeper verbs (find a memory, open a graph node, place a paper trade)
// register here as their panels land, never as dead placeholders
// (rule 6). keyboard-first: type, ↑↓ to move, ↵ to run, esc to close.
//
// the body only mounts while open, so its query/selection start fresh
// every time with no reset effect. selection is clamped at read time,
// not stored clamped, so there is no derived-state effect either.

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PANELS } from "./nav";

export type Command = {
  id: string;
  label: string;
  hint: string;
  run: () => void;
};

// subsequence match: "stg" finds "settings". calm, forgiving.
function matches(q: string, text: string): boolean {
  if (!q) return true;
  const t = text.toLowerCase();
  let i = 0;
  for (const ch of q.toLowerCase()) {
    i = t.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function CommandPalette({
  open,
  onClose,
  onNewThread,
}: {
  open: boolean;
  onClose: () => void;
  onNewThread: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="close command palette"
            onClick={onClose}
            className="absolute inset-0 bg-ink/10 backdrop-blur-[2px]"
          />
          <PaletteBody onClose={onClose} onNewThread={onNewThread} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaletteBody({
  onClose,
  onNewThread,
}: {
  onClose: () => void;
  onNewThread: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "new-thread",
        label: "new thread",
        hint: "start a fresh view",
        run: () => {
          onNewThread();
          router.push("/app");
          onClose();
        },
      },
      ...PANELS.map((p) => ({
        id: `go-${p.key}`,
        label: `go to ${p.label}`,
        hint: p.hint,
        run: () => {
          router.push(p.href);
          onClose();
        },
      })),
    ],
    [onClose, onNewThread, router],
  );

  const filtered = useMemo(
    () => commands.filter((c) => matches(q, `${c.label} ${c.hint}`)),
    [commands, q],
  );

  // clamp at read time: no derived-state effect, never out of range.
  const active = filtered.length ? Math.min(sel, filtered.length - 1) : 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(Math.min(active + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(Math.max(active - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="command palette"
      initial={{ opacity: 0, y: -8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-lg overflow-hidden rounded-bro border border-line bg-bg"
      onKeyDown={onKeyDown}
    >
      <input
        // ref callback focuses on mount (not an effect); the body only
        // mounts when the palette opens, so this fires exactly once.
        ref={(el) => el?.focus()}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        placeholder="what do you need..."
        className="w-full border-b border-line bg-transparent px-5 py-4 text-base text-ink outline-none placeholder:text-soft"
      />
      <ul className="max-h-[46vh] overflow-y-auto py-2" data-lenis-prevent>
        {filtered.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-soft">
            nothing matches that yet.
          </li>
        )}
        {filtered.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              onMouseEnter={() => setSel(i)}
              onClick={() => c.run()}
              className={`flex w-full items-baseline justify-between gap-4 px-5 py-2.5 text-left transition-colors ${
                i === active ? "bg-surface" : ""
              }`}
            >
              <span className="text-sm text-ink">{c.label}</span>
              <span className="shrink-0 text-[12px] text-soft">{c.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
