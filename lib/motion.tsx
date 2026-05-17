"use client";

// bro motion primitives. calm, decelerating, expensive. retuned
// softer than a typical landing. see BRO_PLAN.md §3.6.
//
// usage:
//   <Reveal>...</Reveal>                  one element, fades + rises in view
//   <Stagger><Reveal/><Reveal/></Stagger> children cascade in

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const BRO_EASE = [0.22, 1, 0.36, 1] as const;
export const BRO_DUR = 0.7;
export const BRO_STAGGER = 0.06;

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
