"use client";

// the hamburger. three ink strokes that morph into an x. retuned to the
// bro motion language (calm decelerating ease, no springy bounce). it is
// a real button: aria-expanded, generous hit area, keyboard reachable.

import type { ComponentProps } from "react";
import { motion } from "motion/react";
import { BRO_EASE } from "@/lib/motion";

type PathProps = ComponentProps<typeof motion.path>;

function Stroke(props: PathProps) {
  return (
    <motion.path
      fill="transparent"
      strokeWidth="2"
      stroke="var(--color-ink)"
      strokeLinecap="round"
      transition={{ duration: 0.4, ease: BRO_EASE }}
      {...props}
    />
  );
}

export function MenuToggle({
  open,
  toggle,
}: {
  open: boolean;
  toggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? "close menu" : "open menu"}
      aria-expanded={open}
      className="relative z-[70] flex h-11 w-11 items-center justify-center rounded-bro transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-70"
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <Stroke
          animate={open ? "open" : "closed"}
          variants={{
            closed: { d: "M 2 4 L 20 4" },
            open: { d: "M 3 3 L 19 19" },
          }}
        />
        <Stroke
          d="M 2 11 L 20 11"
          animate={open ? "open" : "closed"}
          variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
          transition={{ duration: 0.2, ease: BRO_EASE }}
        />
        <Stroke
          animate={open ? "open" : "closed"}
          variants={{
            closed: { d: "M 2 18 L 20 18" },
            open: { d: "M 3 19 L 19 3" },
          }}
        />
      </svg>
    </button>
  );
}
