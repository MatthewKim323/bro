// what bro actually is. every line is true to jabby + the plan. no
// overpromising. each of the four is its own section: one big Fraunces
// statement, a quiet line, revealed on a calm scrubbed GSAP
// ScrollTrigger as it scrolls in.

import { ScrollReveal } from "./ScrollReveal";
import { PaperTradeChat } from "./PaperTradeChat";
import { MessagingOrbit } from "./MessagingOrbit";

const FEATURES = [
  {
    k: "always on",
    t: "lives where you do",
    d: "discord, telegram, or the web. same bro, one continuous mind, never logs off.",
  },
  {
    k: "one brain",
    t: "remembers everything",
    d: "your digital life ingested into a private knowledge graph, so it actually knows your world.",
  },
  {
    k: "acts",
    t: "does the thing",
    d: "runs on a schedule, checks in, ships. not a chatbot waiting for prompts.",
  },
  {
    k: "solana",
    t: "paper-trades memecoins",
    d: "watches real Solana movers and trades them on a simulated wallet. real prices, fake funds.",
  },
];

export function Features() {
  return (
    <>
      {FEATURES.map((f, i) => (
        <section
          key={f.k}
          id={i === 0 ? "features" : undefined}
          className={`w-full scroll-mt-24 bg-bg/60 ${
            f.k === "solana" ? "mb-28 sm:mb-44" : ""
          }`}
        >
          <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-center px-8 py-20 sm:px-16">
            <ScrollReveal>
              {f.k === "solana" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className="order-2 flex justify-start lg:order-1">
                    <PaperTradeChat />
                  </div>
                  <div className="order-1 lg:order-2">
                    <h3 className="bro-display text-4xl leading-[1.04] text-ink sm:text-6xl">
                      {f.t}
                    </h3>
                    <p className="bro-body mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                      {f.d}
                    </p>
                  </div>
                </div>
              ) : f.k === "one brain" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className="hidden lg:block" />
                  <div>
                    <h3 className="bro-display text-4xl leading-[1.04] text-ink sm:text-6xl">
                      {f.t}
                    </h3>
                    <p className="bro-body mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                      {f.d}
                    </p>
                  </div>
                </div>
              ) : f.k === "always on" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div>
                    <h3 className="bro-display max-w-xl text-4xl leading-[1.04] text-ink sm:text-6xl">
                      {f.t}
                    </h3>
                    <p className="bro-body mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                      {f.d}
                    </p>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-full max-w-md">
                      <MessagingOrbit />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="bro-display max-w-4xl text-4xl leading-[1.04] text-ink sm:text-6xl">
                    {f.t}
                  </h3>
                  <p className="bro-body mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                    {f.d}
                  </p>
                </>
              )}
            </ScrollReveal>
          </div>
        </section>
      ))}
    </>
  );
}
