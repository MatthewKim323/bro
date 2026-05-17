// product demo: a calm desktop-app frame showing bro actually acting,
// not a faked screenshot. depth from tone (bg vs surface), one radius,
// no shadow. static by design (restraint reads as expensive).

import { BroMark } from "./BroMark";
import { Rise } from "./Rise";

const SIDE = [
  { label: "chat", active: true },
  { label: "memory", active: false },
  { label: "schedule", active: false },
  { label: "trade", active: false },
];

const AGENDA = [
  { text: "call the landlord, 5pm", done: true },
  { text: "book SF flight, fri 9am", done: false },
  { text: "reply to the investor", done: false },
];

export function Demo() {
  return (
    <section
      id="demo"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-8 py-28 sm:px-16 sm:py-32"
    >
      <Rise stagger>
      <h2 className="bro-display max-w-3xl text-4xl leading-[1.04] text-ink text-balance sm:text-6xl">
        see bro work
      </h2>
      <p className="bro-body mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
        not a mockup. it reads what you ask, remembers the context, and
        does the thing.
      </p>

      <div className="mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-bro border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-soft/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-soft/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-soft/40" />
          <div className="ml-3 rounded-bro bg-bg px-3 py-1 text-xs text-soft">
            bro.app
          </div>
        </div>

        <div className="grid sm:grid-cols-[176px_1fr]">
          <div className="hidden flex-col gap-6 border-r border-line bg-bg/50 p-5 sm:flex">
            <div className="flex items-center gap-2">
              <BroMark className="h-6 w-6" />
              <span className="bro-display text-lg text-ink">bro</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {SIDE.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 rounded-bro px-3 py-2 text-sm ${
                    s.active
                      ? "bg-surface font-medium text-ink"
                      : "text-soft"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.active ? "bg-accent" : "bg-soft/40"
                    }`}
                  />
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg p-6 sm:p-8">
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-[18px] bg-accent px-4 py-2.5 text-[13px] leading-snug text-bg">
                  remind me to call the landlord and book the SF flight
                  friday
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-[18px] bg-surface px-4 py-2.5 text-[13px] leading-snug text-ink">
                  done. reminder set for 5pm. i&rsquo;m holding two flights
                  friday, want the 9am?
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <div className="bro-label mb-3 text-soft">today</div>
              <div className="flex flex-col gap-2.5">
                {AGENDA.map((a) => (
                  <div
                    key={a.text}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        a.done
                          ? "border-accent bg-accent text-bg"
                          : "border-line text-transparent"
                      }`}
                    >
                      <span className="text-[9px] leading-none">✓</span>
                    </span>
                    <span
                      className={
                        a.done
                          ? "text-soft line-through"
                          : "text-ink"
                      }
                    >
                      {a.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </Rise>
    </section>
  );
}
