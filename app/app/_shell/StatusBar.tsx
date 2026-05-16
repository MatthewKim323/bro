"use client";

// the status bar. one calm truth about liveness (UX rule 5): a dot + a
// word, never a lie. the panel name doubles as a quiet ⌘K affordance so
// nothing on this bar is decorative (no dead ends, rule 6). colors stay
// inside the locked palette: forest = alive, matcha = working, soft =
// offline. no red, ever. see BRO_PLAN.md §3 / §7 / §9.5.

import type { ConnStatus } from "./useConnection";
import type { PanelKey } from "./nav";

const WORD: Record<ConnStatus, string> = {
  connecting: "connecting",
  connected: "connected",
  reconnecting: "reconnecting",
  offline: "offline",
  thinking: "thinking",
};

// every state's dot lives in the matcha family. meaning comes from the
// word, not from an alarming hue.
const DOT: Record<ConnStatus, string> = {
  connecting: "bg-matcha",
  connected: "bg-accent",
  reconnecting: "bg-matcha",
  offline: "bg-soft",
  thinking: "bg-sage-deep",
};

const PULSES: ConnStatus[] = ["connecting", "reconnecting", "thinking"];

export function StatusBar({
  status,
  panel,
  onOpenPalette,
}: {
  status: ConnStatus;
  panel: PanelKey;
  onOpenPalette: () => void;
}) {
  const pulse = PULSES.includes(status);
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT[status]}`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${DOT[status]}`}
          />
        </span>
        <span className="bro-label">{WORD[status]}</span>
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="group flex items-center gap-1.5 rounded-bro px-2 py-1 text-sm text-soft transition-colors hover:text-ink"
        aria-label="open command palette"
      >
        <span className="bro-display text-ink/90">{panel}</span>
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
          <path
            d="M2.5 4l3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onOpenPalette}
        className="hidden items-center gap-1.5 rounded-bro border border-line px-2.5 py-1 text-soft transition-colors hover:text-ink sm:flex"
        aria-label="open command palette"
      >
        <kbd className="font-sans text-[11px] tracking-wide">⌘K</kbd>
      </button>
    </header>
  );
}
