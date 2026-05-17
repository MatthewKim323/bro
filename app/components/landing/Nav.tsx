// landing nav. not sticky, calm, a hairline underneath. the wordmark is
// the brand signature in Fraunces. "get bro" is the single loud thing.

import Link from "next/link";
import { BroMark } from "./BroMark";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  return (
    <nav className="relative z-[60] mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-7 sm:px-16">
      <Link
        href="/"
        aria-label="bro home"
        className="bro-brand flex items-center gap-1.5"
      >
        <BroMark className="h-8 w-8" />
        <span className="bro-display text-2xl text-ink">bro.</span>
      </Link>
      <div className="flex items-center gap-7 text-sm text-soft">
        <a
          href="#stack"
          className="hidden transition-opacity hover:opacity-70 sm:inline"
        >
          the stack
        </a>
        <Link
          href="/app"
          className="rounded-bro bg-accent px-5 py-2.5 font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
        >
          get bro
        </Link>
        <MobileMenu />
      </div>
    </nav>
  );
}
