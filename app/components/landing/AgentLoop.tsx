"use client";

// "does the thing": one continuous loop, no narration. a dm comes in,
// bro quietly understands the date (a soft tint + an underline drawn
// under the time), then a single real event pill LIFTS off the message
// and flies into the exact calendar slot, settling as the booked
// event. the loop's end state equals its start state, so repeat is
// seamless (no fade-to-zero refresh). measured geometry so the flight
// is pixel-true and responsive. pure DOM + GSAP, FPS-safe. honors
// prefers-reduced-motion (one static booked state).

import { useRef, useLayoutEffect, Fragment } from "react";
import { gsap } from "gsap";
import { BRO_EASE } from "@/lib/motion";

const DAYS = [
  { dow: "WED", date: 13 },
  { dow: "THU", date: 14, active: true },
  { dow: "FRI", date: 15 },
  { dow: "SAT", date: 16 },
];
const HOURS = ["6 PM", "7 PM", "8 PM", "9 PM"];
const GRID = { gridTemplateColumns: "30px repeat(4, 1fr)" } as const;

// pre-existing calendar items (day index 0..3, hour index 0..3)
const STATIC = [
  { label: "gym", day: 0, hour: 0 },
  { label: "gym", day: 1, hour: 0 },
  { label: "study", day: 1, hour: 3 },
];

const cell = (day: number, hour: number) => ({
  left: `calc(30px + ${day} * ((100% - 30px) / 4) + 3px)`,
  width: "calc((100% - 30px) / 4 - 6px)",
  top: `calc(${hour} * 2.5rem + 3px)`,
  height: "calc(2.5rem - 6px)",
});
const TINT = "color-mix(in oklab, var(--color-accent) 13%, var(--color-bg))";

export function AgentLoop() {
  const root = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const grid = gridRef.current;
    const bubble = bubbleRef.current;
    const pill = pillRef.current;
    if (!el || !grid || !bubble || !pill) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let ctx: gsap.Context | null = null;

    const build = () => {
      ctx?.revert();

      const r = el.getBoundingClientRect();
      const g = grid.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      const colW = (g.width - 30) / 4;

      // measure the REAL SAT (3) / 8 PM (2) cell so the pill lands
      // exactly where the grid drew it, inset 3px each side to match
      // the gym/study blocks (perfectly centered in the cell).
      const cellEl = grid.querySelector<HTMLElement>(
        '[data-day="3"][data-hour="2"]',
      );
      const cRect = (cellEl ?? grid).getBoundingClientRect();
      const slot = {
        x: cRect.left - r.left + 3,
        y: cRect.top - r.top + 3,
        w: cRect.width - 6,
        h: cRect.height - 6,
      };
      // lifts off the underlined time in the message
      const origin = {
        x: b.left - r.left + b.width * 0.16,
        y: b.top - r.top + b.height * 0.46,
        w: Math.min(120, colW * 1.05),
        h: 24,
      };

      const setPill = (
        s: typeof slot,
        extra: gsap.TweenVars = {},
      ) =>
        gsap.set(pill, {
          left: s.x,
          top: s.y,
          width: s.w,
          height: s.h,
          ...extra,
        });

      if (reduce) {
        gsap.set(bubble, { backgroundColor: TINT });
        gsap.set(".ag-underline", { scaleX: 1 });
        setPill(slot, { opacity: 1 });
        gsap.set(".ag-check", { opacity: 1 });
        return;
      }

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          repeat: -1,
          defaults: { ease: BRO_EASE },
        });

        // start state (== end state)
        tl.set(bubble, { backgroundColor: "var(--color-bg)" });
        tl.set(".ag-msg", { opacity: 0, y: 12 });
        tl.set(".ag-underline", { scaleX: 0, transformOrigin: "left" });
        tl.set(".ag-check", { opacity: 0 });
        // origin reset lives IN the timeline so it replays each loop
        tl.set(pill, {
          left: origin.x,
          top: origin.y,
          width: origin.w,
          height: origin.h,
          opacity: 0,
          scale: 1,
        });

        // 1. message arrives
        tl.to(".ag-msg", { opacity: 1, y: 0, duration: 0.7 });
        tl.to({}, { duration: 0.55 });

        // 2. bro understands the date: soft tint + underline drawn
        tl.to(bubble, { backgroundColor: TINT, duration: 0.5 });
        tl.to(".ag-underline", { scaleX: 1, duration: 0.55 }, "<");
        tl.to({}, { duration: 0.3 });

        // 3. a single real pill lifts off the message
        tl.to(pill, { opacity: 1, duration: 0.32 });

        // 4. flies straight into the exact slot and snaps clean: no
        // overshoot ease (that was the sway), just the smooth BRO_EASE.
        tl.to(pill, {
          left: slot.x,
          top: slot.y,
          width: slot.w,
          height: slot.h,
          duration: 1,
        });
        tl.to(".ag-check", { opacity: 1, duration: 0.3 }, ">-0.2");

        // 5. booked, hold
        tl.to({}, { duration: 2.1 });

        // 6. seamless clear back to the start state (overlaps so there
        // is never a blank frame; loop restart snaps pill to origin
        // while it is invisible)
        tl.to(pill, { opacity: 0, scale: 0.92, duration: 0.55 });
        tl.to(".ag-underline", { scaleX: 0, duration: 0.45 }, "<");
        tl.to(
          bubble,
          { backgroundColor: "var(--color-bg)", duration: 0.45 },
          "<",
        );
        tl.to(
          ".ag-msg",
          { opacity: 0, y: 10, duration: 0.5 },
          "<0.1",
        );
        tl.to({}, { duration: 0.45 });
      }, root);
    };

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(el);
    return () => {
      ro.disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="relative mx-auto aspect-[4/5] w-full max-w-sm select-none"
    >
      {/* dm */}
      <div className="rounded-bro border border-line bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-deep text-[10px] font-medium text-bg">
            A
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-ink">Angelina</span>
            <span className="text-[10px] text-soft">instagram dm</span>
          </span>
        </div>

        <div className="ag-msg mt-4 flex">
          <div
            ref={bubbleRef}
            className="relative max-w-[84%] rounded-[14px] bg-bg px-3 py-2 text-[12px] leading-snug text-ink"
          >
            boba at tims saturday?
            <span
              className="ag-underline absolute bottom-1.5 left-3 right-3 h-px bg-accent"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>

      {/* calendar, week view */}
      <div className="mt-4 overflow-hidden rounded-bro border border-line bg-bg">
        <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3.5 py-2">
          <span className="text-xs font-semibold text-ink">May 2026</span>
          <div className="flex items-center gap-0.5 text-soft">
            <span className="grid h-4 w-4 place-items-center text-[11px] leading-none">
              &lsaquo;
            </span>
            <span className="grid h-4 w-4 place-items-center text-[11px] leading-none">
              &rsaquo;
            </span>
          </div>
          <span className="ml-auto rounded-bro border border-line px-2 py-0.5 text-[10px] text-soft">
            Today
          </span>
        </div>

        <div className="grid border-b border-line" style={GRID}>
          <div />
          {DAYS.map((d) => (
            <div
              key={d.dow}
              className="flex flex-col items-center gap-1 border-l border-line py-1.5"
            >
              <span className="text-[9px] uppercase tracking-wide text-soft">
                {d.dow}
              </span>
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                  d.active ? "bg-accent font-medium text-bg" : "text-ink"
                }`}
              >
                {d.date}
              </span>
            </div>
          ))}
        </div>

        <div className="relative">
          <div
            ref={gridRef}
            className="grid"
            style={{ ...GRID, gridAutoRows: "2.5rem" }}
          >
            {HOURS.map((h, hi) => (
              <Fragment key={h}>
                <div className="border-t border-line pr-1.5 pt-0.5 text-right text-[9px] leading-none text-soft">
                  {h}
                </div>
                {DAYS.map((d, di) => (
                  <div
                    key={d.dow}
                    data-day={di}
                    data-hour={hi}
                    className="border-l border-t border-line"
                  />
                ))}
              </Fragment>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0">
            {STATIC.map((s, i) => (
              <div
                key={i}
                className="absolute flex flex-col justify-center overflow-hidden rounded-[5px] border-l-2 border-line bg-surface px-2 text-[9px] leading-tight text-soft"
                style={cell(s.day, s.hour)}
              >
                {s.label}
              </div>
            ))}

            <div
              className="absolute left-[30px] right-0 flex items-center"
              style={{ top: "calc(1.62 * 2.5rem)" }}
            >
              <span className="-ml-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="h-px flex-1 bg-accent/55" />
            </div>
          </div>
        </div>
      </div>

      {/* the single real pill: lifts off the message, flies into the
          slot, and stays as the booked event */}
      <div
        ref={pillRef}
        className="absolute z-10 flex items-center justify-between gap-1 overflow-hidden rounded-[6px] border-l-2 border-accent px-2 leading-tight text-ink"
        style={{
          backgroundColor:
            "color-mix(in oklab, var(--color-accent) 20%, var(--color-bg))",
          opacity: 0,
        }}
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold">boba</span>
          <span className="flex items-center gap-0.5 text-[8.5px] text-soft">
            <svg
              viewBox="0 0 24 24"
              className="h-2.5 w-2.5 shrink-0"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.4A2.4 2.4 0 1 1 12 6.6a2.4 2.4 0 0 1 0 4.8z" />
            </svg>
            <span className="truncate">Tim&rsquo;s Boba</span>
          </span>
        </span>
        <span className="ag-check shrink-0 text-[10px] text-accent">✓</span>
      </div>
    </div>
  );
}
