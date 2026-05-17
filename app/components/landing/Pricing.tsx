// pricing. two tiers, minimal. emphasis via tone + accent border, not
// shadow. one radius. CTAs match the rest of the site (free goes to
// the browser app, pro downloads bro).

import Link from "next/link";
import { ScrollFade } from "./ScrollFade";

const FREE = [
  "the browser app",
  "ask bro anything",
  "basic memory",
];

const PRO = [
  "everything in free",
  "lives in discord, telegram, web",
  "unlimited memory graph",
  "acts on a schedule, ships",
  "paper-trades solana",
];

function Tick({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-ink">
      <span className="mt-0.5 text-accent">✓</span>
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-8 py-28 sm:px-16 sm:py-32"
    >
      <ScrollFade>
        <h2 className="bro-display max-w-3xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
          simple pricing
        </h2>
        <p className="bro-body mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
          one bro. yours. cancel anytime, no games.
        </p>

        <div className="mx-auto mt-14 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-bro border border-line bg-surface p-8 transition-transform duration-300 ease-[var(--ease-bro)] hover:-translate-y-1">
          <div className="bro-display text-2xl text-ink">free</div>
          <div className="mt-4 flex items-end gap-1">
            <span className="bro-display text-5xl text-ink">$0</span>
            <span className="mb-1.5 text-sm text-soft">/forever</span>
          </div>
          <p className="bro-body mt-3 text-sm leading-relaxed">
            try bro in your browser.
          </p>
          <ul className="mt-7 flex flex-1 flex-col gap-3">
            {FREE.map((f) => (
              <Tick key={f}>{f}</Tick>
            ))}
          </ul>
          <Link
            href="/app"
            className="mt-8 inline-flex justify-center rounded-bro border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-bg"
          >
            try bro
          </Link>
        </div>

        <div className="relative flex flex-col rounded-bro border border-accent bg-bg p-8 transition-transform duration-300 ease-[var(--ease-bro)] hover:-translate-y-1">
          <span className="absolute right-6 top-6 rounded-bro bg-accent px-3 py-1 text-[11px] font-medium text-bg">
            most popular
          </span>
          <div className="bro-display text-2xl text-ink">pro</div>
          <div className="mt-4 flex items-end gap-1">
            <span className="bro-display text-5xl text-ink">$20</span>
            <span className="mb-1.5 text-sm text-soft">/mo</span>
          </div>
          <p className="bro-body mt-3 text-sm leading-relaxed">
            the always-on agent.
          </p>
          <ul className="mt-7 flex flex-1 flex-col gap-3">
            {PRO.map((f) => (
              <Tick key={f}>{f}</Tick>
            ))}
          </ul>
          <a
            href="/bro.pkg"
            download
            className="mt-8 inline-flex justify-center rounded-bro bg-accent px-7 py-3.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
          >
            get bro
          </a>
        </div>
        </div>
      </ScrollFade>
    </section>
  );
}
