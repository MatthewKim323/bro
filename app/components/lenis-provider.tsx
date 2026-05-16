"use client";

// the landing used Lenis smooth scroll (see BRO_PLAN.md §3.6), but Lenis
// drives scrolling through a per-frame JS loop. on this page that forced a
// full repaint of the fixed full-viewport grain every frame and tanked
// scroll FPS. native scroll hands scrolling to the compositor and stays
// smooth, so Lenis is intentionally not initialized. the provider stays as
// a pass-through so layout.tsx is unchanged. revisit if the grain becomes
// cheap enough to repaint per frame.

import type { ReactNode } from "react";

export function LenisProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
