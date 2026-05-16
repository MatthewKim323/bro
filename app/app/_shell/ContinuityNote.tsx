"use client";

// rule 7, made small. the first time you are in chat, one calm line:
// switching threads is safe because jabby is genuinely one brain. it
// stays until you dismiss it (never a toast that vanishes before you
// read it, rule 6), then it is trusted and never shown again.
//
// "seen" persists via useSyncExternalStore (no mount effect): server
// renders nothing, the client shows it after hydrate if unseen, and it
// animates in either way.

import { AnimatePresence, motion } from "motion/react";
import { useLocalString } from "./useLocalStore";

const SEEN_KEY = "bro.prefs.continuitySeen.v1";

export function ContinuityNote() {
  const [seen, setSeen] = useLocalString(SEEN_KEY);
  const show = seen !== "1";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-6 pb-6"
        >
          <div className="pointer-events-auto flex items-center gap-5 rounded-bro border border-line bg-bg/95 px-5 py-3 backdrop-blur-sm">
            <p className="text-[13px] leading-relaxed text-soft">
              threads organize your view.{" "}
              <span className="text-ink">bro remembers across all of them.</span>
            </p>
            <button
              type="button"
              onClick={() => setSeen("1")}
              className="shrink-0 text-[13px] text-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
