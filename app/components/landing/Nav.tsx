"use client";

// scroll-aware floating navbar. over the hero it is wide and fully
// transparent (no backdrop-filter, so the heavy hero visuals scroll
// free). past the hero it condenses into a compact frosted glass bar
// that follows you down.
//
// CRITICAL: MobileMenu renders a position:fixed overlay. transform OR
// backdrop-filter on any ANCESTOR of it becomes that overlay's
// containing block and traps it inside the bar. so: the frosted blur
// lives in a SIBLING layer, the entrance animation is scoped to the
// brand mark ONLY (not an ancestor of the menu), and the <nav> itself
// never gets a transform. scroll state and "back to top" are native now
// (no JS scroll engine). framer honors prefers-reduced-motion via the
// OS setting.

import { useState, useEffect, type CSSProperties } from "react";
import { motion } from "motion/react";
import { BRO_EASE } from "@/lib/motion";
import { BroMark } from "./BroMark";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.85;
      setScrolled((p) => (p === past ? p : past));

      // hide the whole bar once the last section (the dark zone:
      // keep-up + footer) enters. triggered off the DarkZone wrapper
      // itself, which is min-h-screen, so its top reliably crosses this
      // threshold as you scroll in (unlike the short #waitlist near the
      // document end, whose top could never reach the threshold before
      // the page bottom).
      const zone = document.getElementById("last-zone");
      const hide = zone
        ? zone.getBoundingClientRect().top < window.innerHeight * 0.6
        : false;
      setHidden((p) => (p === hide ? p : hide));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 z-[60] transition-[top,opacity] duration-500 ease-[var(--ease-bro)] ${
        hidden
          ? "pointer-events-none -top-44 opacity-0"
          : "top-0 opacity-100"
      }`}
    >
      <div
        className={`relative mx-auto flex items-center justify-between transition-[max-width,padding] duration-500 ease-[var(--ease-bro)] ${
          scrolled
            ? "mt-3 max-w-3xl px-5 py-3"
            : "max-w-6xl px-8 py-7 sm:px-16"
        }`}
      >
        {/* glass: a SIBLING layer (not an ancestor of the menu), so its
            backdrop-filter never traps the menu's fixed overlay. only
            frosted once past the hero, so zero blur cost during the
            heavy hero scroll. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 rounded-bro border transition-[background-color,border-color] duration-500 ease-[var(--ease-bro)] ${
            scrolled
              ? "border-line/70 bg-[color-mix(in_oklab,var(--color-bg)_72%,transparent)] backdrop-blur-md"
              : "border-transparent bg-transparent"
          }`}
        />
        {/* native anchor: html { scroll-behavior: smooth } glides it
            back to #top, and reduced-motion makes it an instant jump
            for free. no JS, no scroll engine. the framer entrance lives
            here (brand only) so the <nav> stays transform-free. */}
        <motion.a
          href="#top"
          aria-label="back to top"
          className="bro-brand"
          style={
            { "--bro-body-color": "var(--color-accent)" } as CSSProperties
          }
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: BRO_EASE, delay: 0.15 }}
        >
          <BroMark
            className={`transition-[height,width] duration-500 ease-[var(--ease-bro)] ${
              scrolled ? "h-9 w-9" : "h-10 w-10"
            }`}
          />
        </motion.a>
        <div className="flex items-center text-sm text-soft">
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
