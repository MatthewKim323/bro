"use client";

// bro motion primitives. calm, decelerating, expensive. retuned
// softer than a typical landing. see BRO_PLAN.md §3.6.
//
// usage:
//   <Reveal>...</Reveal>                  one element, fades + rises in view
//   <Stagger><Reveal/><Reveal/></Stagger> children cascade in

import { AnimatePresence, motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const BRO_EASE = [0.22, 1, 0.36, 1] as const;
export const BRO_DUR = 0.7;
export const BRO_STAGGER = 0.06;
// in-app surfaces move faster than the landing's big entrance reveals:
// still the same calm ease, just snappier so navigation never drags.
export const BRO_UI_DUR = 0.34;

/**
 * The canvas panel cross-fade. The outgoing panel settles down and out
 * while the incoming one rises in, on the locked ease. `mode="wait"`
 * keeps it clean (no overlap flash). Keyed by panel, so switching
 * threads inside chat does not retrigger it. Reduced motion is honored
 * by the shell's <MotionConfig reducedMotion="user">.
 */
export function PanelTransition({
  panelKey,
  children,
}: {
  panelKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={panelKey}
        className="h-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: BRO_UI_DUR, ease: BRO_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// the sidebar's one-time entrance: blocks cascade in when you walk into
// the app. plays once (the shell never remounts on navigation).
export const railContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};
export const railItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: BRO_EASE },
  },
};

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: BRO_DUR, ease: BRO_EASE },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: BRO_STAGGER, delayChildren: 0.05 },
  },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** delay in seconds, for one-off accents */
  delay?: number;
  as?: "div" | "section" | "span" | "li";
};

/**
 * Single element: fades and rises gently when it enters the viewport.
 * Fires once. motion honors prefers-reduced-motion globally.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={revealVariants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul";
};

/**
 * Container: cascades its <Reveal> children in, one after another.
 * Children should use the `hidden`/`show` variants (Reveal does).
 */
export function Stagger({ children, className, as = "div" }: StaggerProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerVariants}
    >
      {children}
    </Tag>
  );
}
