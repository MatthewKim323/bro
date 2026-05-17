"use client";

// the menu. a calm clipPath reveal from the toggle corner (retuned off
// the springy default to the bro ease), cream surface, no shadow. the
// tabs are a FlowingMenu: lowercase Fraunces rows whose nearest edge
// reveals a forest marquee on hover. esc closes, body scroll locks
// while open, any tab closes it and native-smooth-scrolls to it.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useCycle, type Variants } from "motion/react";
import { BroMark } from "./BroMark";
import { MenuToggle } from "./MenuToggle";
import { FlowingMenu } from "./FlowingMenu";
import { BRO_EASE } from "@/lib/motion";

const TABS: { label: string; href: string; color?: string }[] = [
  { label: "home", href: "#top" },
  { label: "features", href: "#features" },
  { label: "pricing", href: "#pricing" },
  { label: "mailing", href: "#waitlist" },
  { label: "try bro", href: "/app", color: "var(--color-accent)" },
];

// open: the clipPath reveal from the toggle corner. close: NOT the
// reverse, just a clean opacity fade back to where the user was. the
// clip silently resets to a point only after it has fully faded
// (invisible), so the next open still plays the reveal.
const panel: Variants = {
  open: {
    clipPath: "circle(150% at calc(100% - 40px) 40px)",
    opacity: 1,
    transition: {
      clipPath: { duration: 0.7, ease: BRO_EASE },
      opacity: { duration: 0.3, ease: BRO_EASE },
    },
  },
  closed: {
    clipPath: "circle(0px at calc(100% - 40px) 40px)",
    opacity: 0,
    transition: {
      opacity: { duration: 0.75, ease: BRO_EASE },
      clipPath: { duration: 0, delay: 0.75 },
    },
  },
};

const list: Variants = {
  open: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const item: Variants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.5, ease: BRO_EASE } },
  closed: { opacity: 0, y: 18, transition: { duration: 0.3, ease: BRO_EASE } },
};

export function MobileMenu() {
  const [open, toggleOpen] = useCycle(false, true);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleOpen();
    };
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, toggleOpen]);

  // close the menu, then act. route targets (e.g. /app) navigate;
  // in-page #targets scroll natively (the section's scroll-margin-top
  // clears the fixed nav, html { scroll-behavior: smooth } glides it,
  // and reduced-motion flips that to an instant jump for free).
  // FlowingMenu prevents the native nav and calls this with the href.
  const select = (href: string) => {
    toggleOpen();
    window.setTimeout(() => {
      if (!href.startsWith("#")) {
        router.push(href);
        return;
      }
      document
        .querySelector(href)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <>
      <MenuToggle open={open} toggle={() => toggleOpen()} />

      <motion.div
        initial={false}
        animate={open ? "open" : "closed"}
        variants={panel}
        aria-hidden={!open}
        className={`fixed inset-0 z-50 bg-bg ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <motion.nav
          variants={list}
          aria-label="site"
          className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-8 sm:px-16"
        >
          <motion.div
            variants={item}
            className="mb-6 flex flex-col items-center gap-0.5"
          >
            <BroMark className="h-12 w-12" />
            <span className="bro-display text-sm text-ink">bro.</span>
          </motion.div>

          <motion.div
            variants={item}
            className="h-[56vh] border-y border-line"
          >
            <FlowingMenu
              items={TABS.map((t) => ({
                text: t.label,
                href: t.href,
                color: t.color,
              }))}
              onSelect={select}
            />
          </motion.div>

        </motion.nav>
      </motion.div>
    </>
  );
}
