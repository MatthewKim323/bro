"use client";

// the one reveal primitive for the landing's calm sections. GSAP
// ScrollTrigger, ScrollSmoother-aware (same as ScrollReveal/DarkZone),
// but play-ONCE with no scrub so it can never stick mid-state like the
// old scrubbed footer did. the hidden "from" state is ONLY ever set
// inside the no-reduced-motion branch, so if motion is reduced (or
// anything goes wrong) the content is simply visible, never trapped
// invisible. optional stagger of direct children.

import { useRef, useLayoutEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BRO_EASE } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

export function Rise({
  children,
  className,
  stagger = false,
  y = 26,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  y?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const targets =
        stagger && el.children.length
          ? (Array.from(el.children) as HTMLElement[])
          : el;
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.9,
        delay,
        ease: BRO_EASE,
        stagger: stagger ? 0.09 : 0,
        // wipe residual inline transform/opacity once revealed so CSS
        // hover transforms on cards are not fought or stuck.
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, [stagger, y, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
