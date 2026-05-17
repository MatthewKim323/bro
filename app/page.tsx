// the bro landing. one locked design system (split matcha field +
// grain + Fraunces). the hero phone is a REAL iMessage-style thread
// wired to Backboard (not a faked demo). Solana (live pulse) and
// MongoDB Atlas (waitlist) power their own sections. nothing faked.

import Link from "next/link";
import { MatchaField } from "@/app/components/MatchaField";
import { DottedGrid } from "@/app/components/DottedGrid";
import { Reveal } from "@/lib/motion";
import { Nav } from "@/app/components/landing/Nav";
import RotatingText from "@/app/components/landing/RotatingText";
import { TechStack } from "@/app/components/landing/TechStack";
import { IPhone } from "@/app/components/landing/IPhone";
import { PhoneChat } from "@/app/components/landing/PhoneChat";
import { Features } from "@/app/components/landing/Features";
import { Demo } from "@/app/components/landing/Demo";
import { Testimonials } from "@/app/components/landing/Testimonials";
import { Pricing } from "@/app/components/landing/Pricing";
import { Waitlist } from "@/app/components/landing/Waitlist";
import { Footer } from "@/app/components/landing/Footer";
import { DarkZone } from "@/app/components/landing/DarkZone";
import { SmoothScroll } from "@/app/components/landing/SmoothScroll";

export default function Home() {
  return (
    <>
      <Nav />
      <SmoothScroll>
        <main>

      {/* ── hero: copy left, live bro phone right (Folk-style 2-col) ── */}
      <section
        id="top"
        className="relative flex min-h-[100svh] items-center overflow-hidden"
      >
        <MatchaField />
        {/* painterly meadow, overlaid on the green half. masked on the
            same 104deg axis as the matcha gradient (now revealing more
            of the image for a smoother horizontal fade) AND fading out
            toward the hero bottom so it melts into the next section.
            the two masks are intersected. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-left bg-no-repeat opacity-[0.44]"
          style={{
            backgroundImage: "url(/hero-field.png)",
            WebkitMaskImage:
              "linear-gradient(104deg, #000 0%, #000 34%, rgba(0,0,0,0.6) 56%, transparent 80%), linear-gradient(to bottom, #000 55%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage:
              "linear-gradient(104deg, #000 0%, #000 34%, rgba(0,0,0,0.6) 56%, transparent 80%), linear-gradient(to bottom, #000 55%, transparent 100%)",
            maskComposite: "intersect",
          }}
        />
        <DottedGrid corner="tr" size={320} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-8 py-16 sm:px-16 lg:grid-cols-[6fr_5fr] lg:gap-10 lg:py-24">
          <div>
            <Reveal>
              <h1 className="bro-pushed bro-display text-[clamp(4.5rem,13vw,9rem)] leading-none text-ink">
                bro.
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-lg text-soft sm:text-xl">your</span>
                <RotatingText
                  texts={[
                    "agent",
                    "second brain",
                    "scheduler",
                    "trader",
                    "friend",
                  ]}
                  mainClassName="bro-display text-accent text-3xl sm:text-4xl"
                  splitLevelClassName="overflow-hidden pb-1"
                  staggerFrom="last"
                  staggerDuration={0.02}
                  rotationInterval={2200}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-110%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                />
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="bro-body mt-6 max-w-md text-lg leading-relaxed sm:text-xl">
                always on, always yours. it knows your world, remembers
                everything, and actually acts on it.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
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
            <Reveal delay={0.32}>
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

          <div className="relative pt-24 sm:pt-32">
            {/* cream fade at the hero/features seam (this sits exactly
                at 100svh, so it is below the fold and never visible
                while the hero fills the screen, the fade only engages
                once you scroll past the full hero). */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-56 bg-gradient-to-b from-bg to-transparent"
            />
            <Features />
          </div>
          <Demo />
          <Testimonials />
          <Pricing />
          <DarkZone>
            <Waitlist />
            <Footer />
          </DarkZone>
        </main>
      </SmoothScroll>
    </>
  );
}
