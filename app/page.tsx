// the bro landing. one locked design system (split matcha field +
// grain + Fraunces). every sponsor integration powers a real, visible
// feature on this page: Solana (live pulse), Backboard (talk to bro),
// MongoDB Atlas (waitlist). nothing faked.

import Link from "next/link";
import { MatchaField } from "@/app/components/MatchaField";
import { DottedGrid } from "@/app/components/DottedGrid";
import { Reveal } from "@/lib/motion";
import { Nav } from "@/app/components/landing/Nav";
import { SolanaPulse } from "@/app/components/landing/SolanaPulse";
import { TalkToBro } from "@/app/components/landing/TalkToBro";
import { Features } from "@/app/components/landing/Features";
import { Waitlist } from "@/app/components/landing/Waitlist";
import { Footer } from "@/app/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />

      {/* ── hero ────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
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
                <a
                  href="#talk"
                  className="text-sm text-soft underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  see how it works
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SolanaPulse />
      <TalkToBro />
      <Features />
      <Waitlist />
      <Footer />
    </main>
  );
}
