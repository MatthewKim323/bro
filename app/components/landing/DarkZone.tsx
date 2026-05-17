"use client";

// the bottom of the site goes dark. a forest (var(--color-accent))
// backdrop sits behind its children and fades in, scrubbed to scroll
// position, as the zone enters view: calm, no jank, cannot strobe.
// honors prefers-reduced-motion (just shows the dark, no fade). the
// children (Waitlist, Footer) carry cream text for this zone.

import { useRef, useLayoutEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function DarkZone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const layer = bg.current;
    if (!el || !layer) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        layer,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.5,
          },
        },
      );
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(layer, { opacity: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={ref}
      id="last-zone"
      className="relative flex min-h-screen flex-col"
    >
      <div
        ref={bg}
        aria-hidden
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 bg-accent"
      />
      <div className="relative flex flex-1 flex-col justify-end">
        {children}
      </div>
    </div>
  );
}
