// what bro actually is. every line is true to jabby + the plan. no
// overpromising: the trading line says paper, the graph says private.

import { Label } from "@/app/components/Label";
import { Reveal, Stagger } from "@/lib/motion";

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
    <section className="mx-auto w-full max-w-6xl px-8 py-28 sm:px-16">
      <Reveal>
        <Label>what it is</Label>
        <h2 className="bro-display mt-4 max-w-2xl text-4xl text-ink sm:text-5xl">
          not an assistant. a presence.
        </h2>
      </Reveal>
      <Stagger className="mt-14 grid gap-px overflow-hidden rounded-bro border border-line bg-line sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Reveal key={f.k}>
            <div className="h-full bg-bg p-9">
              <Label>{f.k}</Label>
              <h3 className="bro-display mt-4 text-2xl text-ink">{f.t}</h3>
              <p className="bro-body mt-3 text-[15px] leading-relaxed">
                {f.d}
              </p>
            </div>
          </Reveal>
        ))}
      </Stagger>
    </section>
  );
}
