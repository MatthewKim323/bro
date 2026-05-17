// the bro landing. one locked design system (split matcha field +
// grain + Fraunces). the hero phone is a REAL iMessage-style thread
// wired to Backboard (not a faked demo). Solana (live pulse) and
// MongoDB Atlas (waitlist) power their own sections. nothing faked.

import Link from "next/link";
import { MatchaField } from "@/app/components/MatchaField";
import { DottedGrid } from "@/app/components/DottedGrid";
import { Reveal } from "@/lib/motion";
import { Nav } from "@/app/components/landing/Nav";
import { TechStack } from "@/app/components/landing/TechStack";
import { IPhone } from "@/app/components/landing/IPhone";
import { PhoneChat } from "@/app/components/landing/PhoneChat";
import { Features } from "@/app/components/landing/Features";
import { Waitlist } from "@/app/components/landing/Waitlist";
import { Footer } from "@/app/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />

      {/* ── hero: copy left, live bro phone right (Folk-style 2-col) ── */}
      <section id="top" className="relative overflow-hidden">
        <MatchaField />
        <DottedGrid corner="tr" size={320} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-8 py-16 sm:px-16 lg:grid-cols-[6fr_5fr] lg:gap-10 lg:py-24">
          <div>
            <Reveal>
              <h1 className="bro-display text-[clamp(4.5rem,13vw,9rem)] leading-none text-ink">
                bro.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="bro-body mt-7 max-w-md text-xl leading-relaxed sm:text-2xl">
                not an assistant. your bro. it knows your whole world,
                remembers everything, and never logs off.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/bro.pkg"
                  download
                  className="rounded-bro bg-accent px-7 py-3.5 text-sm font-medium text-bg transition-opacity duration-200 ease-[var(--ease-bro)] hover:opacity-85"
                >
                  get bro
                </a>
                <Link
                  href="/app"
                  className="rounded-bro border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-surface"
                >
                  try bro in your browser
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <TechStack />
            </Reveal>
          </div>

          <Reveal delay={0.15} className="flex justify-center lg:justify-end">
            <IPhone>
              <PhoneChat />
            </IPhone>
          </Reveal>
        </div>
      </section>

      <Features />
      <Waitlist />
      <Footer />
    </main>
  );
}
