// a crisp iPhone frame. pure CSS/SVG, no device PNG (ours, recolors to
// the matcha world, sharp at any DPI). this is the same idea as Folk's
// hero phone but built from scratch: a dark titanium body, thin bezel,
// Dynamic Island, a clipped screen. it holds whatever screen you give
// it (we put a live bro iMessage thread inside). see docs/BRO_PLAN.md §3.
//
// presentational + server-safe: no state, just frame + children.

import type { ReactNode } from "react";

export function IPhone({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[300px] sm:w-[326px]">
      {/* soft grounded shadow (a device may lift; keep it tonal) */}
      <div
        aria-hidden
        className="absolute inset-x-6 bottom-3 h-16 rounded-[50%] bg-ink/20 blur-2xl"
      />

      {/* titanium body */}
      <div className="relative aspect-[300/620] rounded-[3.2rem] bg-ink p-[3px] shadow-[0_30px_60px_-20px_rgba(35,36,31,0.45)]">
        {/* brushed rim highlight */}
        <div className="absolute inset-0 rounded-[3.2rem] ring-1 ring-white/10" />
        {/* side buttons */}
        <span
          aria-hidden
          className="absolute -left-[2px] top-[22%] h-9 w-[3px] rounded-l bg-ink/80"
        />
        <span
          aria-hidden
          className="absolute -left-[2px] top-[33%] h-14 w-[3px] rounded-l bg-ink/80"
        />
        <span
          aria-hidden
          className="absolute -left-[2px] top-[46%] h-14 w-[3px] rounded-l bg-ink/80"
        />
        <span
          aria-hidden
          className="absolute -right-[2px] top-[30%] h-20 w-[3px] rounded-r bg-ink/80"
        />

        {/* bezel + screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[3rem] bg-bg">
          {/* Dynamic Island */}
          <div
            aria-hidden
            className="absolute left-1/2 top-2.5 z-30 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-ink"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
