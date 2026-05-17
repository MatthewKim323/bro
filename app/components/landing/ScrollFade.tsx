"use client";

// the same scrubbed fade the hero and dark zone use, for a mid-page
// section: opacity is tied to scroll, so the block eases IN as you
// scroll toward it, holds while it is on screen, and eases OUT as you
// scroll away. one GSAP timeline + ScrollTrigger scrub
// (ScrollSmoother-aware). honors prefers-reduced-motion (stays fully
// visible, no fade).

import { useRef, useLayoutEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // one tween, one opacity track [in, hold, hold, out] spread over
      // the WHOLE in-view pass (top-bottom -> bottom-top). a single
      // scrubbed tween has no inter-tween boundaries to pop at, and the
      // full-range start/end means gentle ramps instead of a late snap.
      gsap.set(el, { opacity: 0 });
      gsap.to(el, {
        keyframes: { opacity: [0, 1, 1, 0], easeEach: "none" },
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(el, { opacity: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
