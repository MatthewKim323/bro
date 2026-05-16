// TEMPORARY: signature verification specimen for phase 0. proves the
// matcha field + grain + dotted grid + Fraunces/Inter system reads as
// the inspo before we build the real landing (phase 1 replaces this).

import Link from "next/link";
import { MatchaField } from "@/app/components/MatchaField";
import { DottedGrid } from "@/app/components/DottedGrid";
import { Reveal, Stagger } from "@/lib/motion";

const SWATCHES = [
  ["bg", "#f4f3ef"],
  ["surface", "#e4e8dc"],
  ["matcha", "#a8b89a"],
  ["sage-deep", "#7e9270"],
  ["accent", "#5e7351"],
  ["ink", "#23241f"],
  ["soft", "#7c8a72"],
  ["line", "#e0e2d7"],
] as const;

export default function Home() {
  return (
    <main>
      {/* ── hero specimen ───────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <MatchaField />
        <DottedGrid corner="tr" size={320} />

        <div className="relative z-10 w-full max-w-6xl px-8 sm:px-16">
          <div className="max-w-2xl">
            <Reveal>
              <h1 className="bro-display text-[clamp(5rem,16vw,12rem)] leading-none text-ink">
                bro.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="bro-body mt-8 max-w-xl text-xl leading-relaxed sm:text-2xl">
                not an assistant. your bro. it knows your whole world,
                remembers everything, and never logs off.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-12 flex items-center gap-5">
                <Link
                  href="/app"
                  className="rounded-bro bg-accent px-7 py-3.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
                >
                  get bro
                </Link>
                <span className="text-sm text-soft underline underline-offset-4">
                  see how it works
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── palette + scroll/motion check ───────────────────── */}
      <section className="relative mx-auto max-w-5xl px-6 py-32">
        <Reveal>
          <span className="bro-label">the locked palette</span>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="bro-display mt-4 text-4xl text-ink">
            matcha, sampled not eyeballed.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map(([name, hex]) => (
            <Reveal key={name}>
              <div className="overflow-hidden rounded-bro border border-line">
                <div className="h-28" style={{ backgroundColor: hex }} />
                <div className="bg-surface px-4 py-3">
                  <div className="text-sm text-ink">{name}</div>
                  <div className="font-mono text-xs text-soft">{hex}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <p className="bro-body mt-16 max-w-2xl text-lg">
            grain sits over everything in soft-light, the field melts deep
            sage at the edges into cream at the center, and the type pairs a
            soft serif display with a quiet sans. if this reads luxurious and
            calm, the foundation is right.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
