"use client";

// holds the hero entrance until the preloader hands off, so the user
// actually sees it. before that, the children are not mounted, so their
// Reveal / bro-pushed animations have not fired yet; the instant the
// loader hands off they mount and play (through the dissolving curtain).
//
// gated purely on the loader signal: it has a deterministic server
// snapshot (false), so SSR and the first client render agree (no
// hydration mismatch). reduced motion is handled upstream, the
// Preloader fires the signal immediately when there is no curtain.

import type { ReactNode } from "react";
import { useLoaderDone } from "./loader";

export function HeroGate({ children }: { children: ReactNode }) {
  return useLoaderDone() ? <>{children}</> : null;
}
