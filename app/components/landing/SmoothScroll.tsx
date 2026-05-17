"use client";

// GSAP ScrollSmoother, scoped to the LANDING only (the app shell keeps
// precise native scroll, BRO_PLAN.md 3.6). this reintroduces a global
// JS smooth-scroll engine (the Lenis-class thing we removed for FPS):
// watch performance. fixed UI (the hamburger menu) is rendered OUTSIDE
// #smooth-content by page.tsx so it is not transformed. honors reduced
// motion: under reduce, this is a plain pass-through (native scroll).

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !wrapper.current || !content.current) return;
    const ctx = gsap.context(() => {
      ScrollSmoother.create({
        wrapper: wrapper.current as HTMLElement,
        content: content.current as HTMLElement,
        smooth: 1,
        effects: true,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
}
