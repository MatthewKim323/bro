"use client";

// scroll-aware floating navbar. over the hero it is wide and fully
// transparent (no backdrop-filter, so the heavy hero visuals scroll
// free). past the hero it condenses into a compact frosted glass bar
// that follows you down.
//
// CRITICAL: MobileMenu renders a position:fixed overlay. transform OR
// backdrop-filter on any ANCESTOR of it becomes that overlay's
// containing block and traps it inside the bar. so: the frosted blur
// lives in a SIBLING layer (never an ancestor of the menu), and the
// GSAP entrance clearProps's itself so no residual transform remains.
// scroll state uses the native scroll (ScrollSmoother uses real
// scroll), decoupled from ScrollTrigger/smoother init order so it is
// reliable. honors prefers-reduced-motion.

import Link from "next/link";
import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { BroMark } from "./BroMark";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.85;
      setScrolled((p) => (p === past ? p : past));

      // hide the whole bar once the dark "keep up" + footer zone takes
      // over the screen, bring it back smoothly on the way up. measured
      // off the element's visual rect so it stays correct under
      // ScrollSmoother (which moves content by transform).
      const zone = document.getElementById("waitlist");
      const hide = zone
        ? zone.getBoundingClientRect().top < window.innerHeight * 0.45
        : false;
      setHidden((p) => (p === hide ? p : hide));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !navRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });
      // the whole bar fades + drops in (this is the only opacity tween,
      // so it never fights the CTA's own css opacity transition). then
      // the brand + actions get a transform-ONLY stagger (no opacity),
      // so the get bro button glides in smoothly instead of popping.
      // clearProps wipes residual transforms so nothing remains to
      // hijack the menu's fixed positioning.
      tl.from(navRef.current, {
        yPercent: -130,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "all",
      }).from(
        "[data-sauce]",
        {
          y: -14,
          duration: 0.7,
          stagger: 0.09,
          ease: "power3.out",
          clearProps: "transform",
        },
        "-=0.6",
      );
    }, navRef);
    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navRef}
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
        <Link
          href="/"
          aria-label="bro home"
          data-sauce
          className="bro-brand"
          style={
            { "--bro-body-color": "var(--color-accent)" } as CSSProperties
          }
        >
          <BroMark
            className={`transition-[height,width] duration-500 ease-[var(--ease-bro)] ${
              scrolled ? "h-8 w-8" : "h-9 w-9"
            }`}
          />
        </Link>
        <div className="flex items-center gap-7 text-sm text-soft">
          <Link
            href="/app"
            data-sauce
            className="rounded-bro bg-accent px-5 py-2.5 font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
          >
            get bro
          </Link>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
