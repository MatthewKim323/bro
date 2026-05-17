// what bro actually is. every line is true to jabby + the plan. no
// overpromising. each of the four is its own section: one big Fraunces
// statement, a quiet line, revealed on a calm scrubbed GSAP
// ScrollTrigger as it scrolls in.

import { ScrollReveal } from "./ScrollReveal";
import { PaperTradeChat } from "./PaperTradeChat";
import { PlatformCloud } from "./PlatformCloud";
import { MemoryGraph } from "./MemoryGraph";
import { AgentLoop } from "./AgentLoop";
import { FeatureCta } from "./FeatureCta";

type Feature = {
  k: string;
  t: string;
  body: string;
  points?: string[];
  pull?: { lead: string; emph: string };
  chips?: string[];
  cta?: { label: string; href: string };
};

// each section gets a deliberately different text composition so the
// page never reads as one template repeated four times.
const FEATURES: Feature[] = [
  {
    // body + button only. the orbit already shows the platforms, so a
    // bullet list would just repeat it.
    k: "always on",
    t: "lives where you do",
    body: "discord, telegram, or the web, it is one continuous mind across all of them. same thread, same memory, no re-introducing yourself every morning. it never logs off, so it is already caught up before you are.",
    cta: { label: "see it work", href: "#demo" },
  },
  {
    // text-led with the spec bullets. privacy and control genuinely
    // deserve a list, and no CTA keeps it calm.
    k: "one brain",
    t: "remembers everything",
    body: "the things you mention once get pulled into a private knowledge graph. bro recalls the detail months later and links it like a wiki, so it actually knows your world.",
    points: [
      "a private graph only you can read",
      "recall across months of context",
      "browse, edit, or delete any memory",
    ],
  },
  {
    // body + a punchy pull line + button. no list.
    k: "acts",
    t: "acts on its own",
    body: "bro runs on a schedule instead of waiting to be asked. it reads your inbound, drafts the reply, books the meeting, and pings you only when something actually needs you.",
    pull: { lead: "a chatbot answers.", emph: "bro ships." },
    cta: { label: "watch it act", href: "#demo" },
  },
  {
    // body + inline spec chips + button. different texture again.
    k: "solana",
    t: "paper-trades memecoins",
    body: "chat with bro about what is on your watchlist, or not. he runs the research himself, reads the real Solana flow, and weighs it against what he already knows about you, then trades the calls on a simulated wallet at live prices.",
    chips: ["real prices", "simulated wallet", "zero real keys"],
    cta: { label: "open the trade panel", href: "/app" },
  },
];

function FeatureText({ f }: { f: Feature }) {
  return (
    <>
      <p className="bro-body mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
        {f.body}
      </p>

      {f.points && (
        <ul className="mt-7 flex max-w-xl flex-col gap-2.5">
          {f.points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 text-sm text-ink sm:text-[15px]"
            >
              <span
                aria-hidden
                className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {f.pull && (
        <p className="bro-display mt-8 max-w-xl text-2xl leading-snug text-ink sm:text-3xl">
          {f.pull.lead}{" "}
          <span className="text-accent">{f.pull.emph}</span>
        </p>
      )}

      {f.chips && (
        <div className="mt-7 flex max-w-xl flex-wrap gap-2">
          {f.chips.map((c) => (
            <span
              key={c}
              className="rounded-bro border border-line px-3 py-1.5 text-xs text-soft"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {f.cta && <FeatureCta href={f.cta.href} label={f.cta.label} />}
    </>
  );
}

export function Features() {
  return (
    <>
      {FEATURES.map((f, i) => (
        <section
          key={f.k}
          id={i === 0 ? "features" : undefined}
          className={`w-full scroll-mt-24 bg-bg ${
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
                    <h3 className="bro-display text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
                      {f.t}
                    </h3>
                    <FeatureText f={f} />
                  </div>
                </div>
              ) : f.k === "one brain" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className="order-2 flex justify-center lg:order-1">
                    <div className="w-full max-w-md">
                      <MemoryGraph />
                    </div>
                  </div>
                  <div className="order-1 lg:order-2">
                    <h3 className="bro-display text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
                      {f.t}
                    </h3>
                    <FeatureText f={f} />
                  </div>
                </div>
              ) : f.k === "always on" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div>
                    <h3 className="bro-display max-w-xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
                      {f.t}
                    </h3>
                    <FeatureText f={f} />
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-full max-w-md">
                      <PlatformCloud />
                    </div>
                  </div>
                </div>
              ) : f.k === "acts" ? (
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div>
                    <h3 className="bro-display max-w-xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
                      {f.t}
                    </h3>
                    <FeatureText f={f} />
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <AgentLoop />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="bro-display max-w-4xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
                    {f.t}
                  </h3>
                  <FeatureText f={f} />
                </>
              )}
            </ScrollReveal>
          </div>
        </section>
      ))}
    </>
  );
}
