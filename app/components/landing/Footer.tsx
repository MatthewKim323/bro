// footer. the built-with row is honest: every one of these is a real
// dependency that powers a real feature on this page.

import { Label } from "@/app/components/Label";

const STACK = [
  "Next.js",
  "Solana",
  "MongoDB Atlas",
  "Backboard",
];

export function Footer() {
  return (
    <footer
      id="stack"
      className="mt-28 scroll-mt-24"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 py-16 sm:px-16">
        <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-end">
          <div>
            <div className="bro-display text-3xl text-bg">bro.</div>
            <p className="bro-body mt-3 max-w-xs text-sm text-bg/70">
              the one that already knows you.
            </p>
          </div>
          <div>
            <Label className="text-bg/55">built with</Label>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-bg/70">
              {STACK.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-bg/15 pt-7 text-xs text-bg/60">
          <span>made by Kali Labs</span>
          <span>&copy; 2026</span>
        </div>
      </div>
    </footer>
  );
}
