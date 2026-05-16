"use client";

// the menu. a calm clipPath reveal from the toggle corner (retuned off
// the springy default to the bro ease), cream surface, hairline dividers,
// no shadow. tabs are Fraunces with a tracked index, deliberately spaced.
// esc closes, body scroll locks while open, any tab closes it.

import { useEffect } from "react";
import Link from "next/link";
import { motion, useCycle, type Variants } from "motion/react";
import { MenuToggle } from "./MenuToggle";
import { BRO_EASE } from "@/lib/motion";

const TABS = [
  { label: "home", href: "#top" },
  { label: "what it does", href: "#features" },
  { label: "the waitlist", href: "#waitlist" },
];

const panel: Variants = {
  open: {
    clipPath: "circle(150% at calc(100% - 40px) 40px)",
    transition: { duration: 0.7, ease: BRO_EASE },
  },
  closed: {
    clipPath: "circle(0px at calc(100% - 40px) 40px)",
    transition: { duration: 0.5, ease: BRO_EASE, delay: 0.12 },
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
          <motion.span
            variants={item}
            className="bro-label mb-10 block text-soft"
          >
            bro
          </motion.span>

          <ul className="divide-y divide-line border-y border-line">
            {TABS.map((t) => (
              <motion.li key={t.href} variants={item}>
                <a
                  href={t.href}
                  onClick={() => toggleOpen()}
                  className="group block py-5 transition-opacity duration-200 ease-[var(--ease-bro)]"
                >
                  <span className="bro-display text-4xl text-ink transition-colors duration-200 ease-[var(--ease-bro)] group-hover:text-accent sm:text-5xl">
                    {t.label}
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>

          <motion.div variants={item} className="mt-12">
            <Link
              href="/app"
              onClick={() => toggleOpen()}
              className="inline-flex rounded-bro bg-accent px-7 py-3.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
            >
              get bro
            </Link>
          </motion.div>
        </motion.nav>
      </motion.div>
    </>
  );
}
