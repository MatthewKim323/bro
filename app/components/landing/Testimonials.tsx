// social proof. placeholder quotes for UI only. calm 3-up grid, depth
// from tone, one radius, no shadow. monogram avatars (no fake photos,
// reads cleaner and more premium).

import { Rise } from "./Rise";

type Quote = {
  body: string;
  name: string;
  role: string;
  initials: string;
  tone: string;
};

const QUOTES: Quote[] = [
  {
    body:
      "i stopped keeping a second brain across twelve apps. bro just knows. it texted me about my mom's birthday before i remembered it myself.",
    name: "Brandon Jimenez",
    role: "solo operator",
    initials: "BJ",
    tone: "var(--color-accent)",
  },
  {
    body:
      "the part that sold me wasn't the chat. it was waking up to bro saying it already replied to the investor and booked my flight. it acts.",
    name: "Shaan Mistry",
    role: "product manager at apple",
    initials: "SM",
    tone: "var(--color-sage-deep)",
  },
  {
    body:
      "ngl i only got it to flex on the group chat. now bro runs my whole life and i just vibe. genuinely have no clue what i do all day anymore. unreal.",
    name: "Stephen Hung",
    role: "full-time passenger",
    initials: "SH",
    tone: "var(--color-matcha)",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-8 py-28 sm:px-16 sm:py-32"
    >
      <Rise stagger>
        <h2 className="bro-display max-w-3xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
          loved by people with a lot to remember
        </h2>
        <p className="bro-body mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
          founders, operators, and the chronically busy. here is what a
          month with bro feels like.
        </p>
      </Rise>

      <Rise stagger className="mt-14 grid gap-6 lg:grid-cols-3">
        {QUOTES.map((q) => (
          <figure
            key={q.name}
            className="flex flex-col justify-between gap-8 rounded-bro border border-line bg-surface p-7 transition-[transform,border-color] duration-300 ease-[var(--ease-bro)] hover:-translate-y-1 hover:border-soft/50 sm:p-8"
          >
            <blockquote className="bro-body text-lg leading-relaxed text-ink">
              {`"${q.body}"`}
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-medium text-bg"
                style={{ backgroundColor: q.tone }}
              >
                {q.initials}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink">
                  {q.name}
                </span>
                <span className="text-xs text-soft">{q.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </Rise>
    </section>
  );
}
