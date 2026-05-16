// what bro actually is. every line is true to jabby + the plan. no
// overpromising. each of the four is its own full-screen section: a
// tracked label, one big Fraunces statement, a quiet line. no scroll
// library, calm reveal only.

import { Label } from "@/app/components/Label";
import { Reveal } from "@/lib/motion";

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
          className={`w-full scroll-mt-24 ${
            i % 2 === 1 ? "bg-surface" : "bg-bg"
          }`}
        >
          <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center px-8 py-28 sm:px-16">
            <Reveal>
              <Label>{f.k}</Label>
              <h3 className="bro-display mt-6 max-w-4xl text-6xl leading-[1.02] text-ink sm:text-8xl">
                {f.t}
              </h3>
              <p className="bro-body mt-8 max-w-xl text-xl leading-relaxed sm:text-2xl">
                {f.d}
              </p>
            </Reveal>
          </div>
        </section>
      ))}
    </>
  );
}
