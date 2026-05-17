"use client";

// the hero fades the same way the dark footer zone does: a scrubbed
// opacity tied to scroll, so it eases OUT as you scroll away from it
// and back IN as you scroll toward it. same GSAP scrub pattern as
// DarkZone (ScrollSmoother-aware). honors prefers-reduced-motion (stays
// fully visible, no fade).

import { useRef, useLayoutEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        },
      );
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(el, { opacity: 1 });
    });
    return () => mm.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
