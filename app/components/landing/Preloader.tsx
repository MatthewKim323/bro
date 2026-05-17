"use client";

// the landing preloader, driven by motion/react. a brief cream curtain:
// the bro mark settles, a progress ring sweeps smoothly the whole way
// around him (close, hugging him), he blinks once as it fills, then the
// curtain dissolves up into the hero. one shot on first paint. the ring
// and blink use easeInOut (no stall, natural lid); the brand entrance
// and the dissolve keep the locked ease. reduced motion: skipped
// entirely, the page is instant (also guarded pre-paint in the css).

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BRO_EASE } from "@/lib/motion";
import { Grain } from "@/app/components/Grain";
import { markLoaderDone } from "./loader";
import "./Preloader.css";

const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R; // circumference, ~289

export function Preloader() {
  const reduce = useReducedMotion();
  const [present, setPresent] = useState(true);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduce) {
      markLoaderDone();
      setGone(true);
      return;
    }
    // ring fills at ~1.5s (0.4s delay + 1.1s sweep), the single blink
    // runs through ~2.05s, then the curtain dissolves (exit). the hero
    // entrance is unlatched here, at the start of the dissolve, so it
    // plays through the lifting curtain instead of behind a closed one.
    const t = window.setTimeout(() => {
      markLoaderDone();
      setPresent(false);
    }, 2150);
    return () => window.clearTimeout(t);
  }, [reduce]);

  if (gone) return null;

  return (
    <AnimatePresence onExitComplete={() => setGone(true)}>
      {present && (
        <motion.div
          key="bro-splash"
          className="bro-splash"
          aria-hidden
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-1%" }}
          transition={{ duration: 1, ease: BRO_EASE }}
        >
          <motion.div
            className="bro-splash-stage"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: BRO_EASE }}
          >
            <svg className="bro-splash-ring" viewBox="0 0 100 100">
              <circle
                className="bro-splash-ring-track"
                cx="50"
                cy="50"
                r={RING_R}
              />
              <motion.circle
                className="bro-splash-ring-arc"
                cx="50"
                cy="50"
                r={RING_R}
                strokeDasharray={RING_C}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.1, ease: "easeInOut", delay: 0.4 }}
              />
            </svg>

            <svg
              className="bro-splash-mark"
              viewBox="0 0 64 64"
              role="img"
              aria-label="bro"
            >
              <rect
                x="8"
                y="7"
                width="48"
                height="50"
                rx="21"
                fill="var(--bro-body-color, var(--color-sage-deep))"
              />
              {[21, 37.4].map((x) => (
                <motion.rect
                  key={x}
                  x={x}
                  y="24.5"
                  width="5.6"
                  height="13"
                  rx="2.8"
                  fill="var(--color-bg)"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                  animate={{ scaleY: [1, 0.06, 1] }}
                  transition={{
                    duration: 0.5,
                    delay: 1.55,
                    ease: "easeInOut",
                    times: [0, 0.45, 1],
                  }}
                />
              ))}
            </svg>
          </motion.div>

          <Grain />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
