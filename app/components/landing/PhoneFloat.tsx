"use client";

// a slow, perpetual idle float for the hero phone: a gentle bob with a
// faint sway, on offset durations so it never reads mechanical. it sits
// inside the hero's existing Reveal (which owns the fade-in entrance)
// and just keeps the device subtly alive under the live thread without
// pulling focus. reduced motion: no float, the phone is static.

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function PhoneFloat({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <motion.div
      style={{ willChange: "transform" }}
      animate={{ y: [0, -8, 0], rotate: [0, 0.5, 0, -0.5, 0] }}
      transition={{
        y: { duration: 7, ease: "easeInOut", repeat: Infinity },
        rotate: { duration: 11, ease: "easeInOut", repeat: Infinity },
      }}
    >
      {children}
    </motion.div>
  );
}
