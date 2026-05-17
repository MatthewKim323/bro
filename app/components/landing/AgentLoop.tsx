"use client";

// "does the thing": a self-running agentic loop. bro scans the dms,
// pulls out an event, and books it into the calendar, on its own,
// forever. pure DOM + one GSAP timeline (no WebGL, FPS-safe). palette
// tones, one radius, no shadow. this is an illustrative depiction of
// agentic behavior, not a literal integration claim. honors
// prefers-reduced-motion (one static resolved state).

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

export function AgentLoop() {
  const root = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const st = status.current;
    if (!el || !st) return;

    const q = gsap.utils.selector(el);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      st.textContent = "booked it";
      gsap.set(q(".ag-event"), { opacity: 1, scale: 1 });
      gsap.set(q(".ag-chip"), { opacity: 0 });
      gsap.set(q(".ag-key"), {
        backgroundColor:
          "color-mix(in oklab, var(--color-accent) 14%, var(--color-bg))",
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: BRO_EASE },
      });

      tl.set(".ag-msg", { opacity: 0, y: 8 });
      tl.set(".ag-chip", { opacity: 0, scale: 0.6, y: 0 });
      tl.set(".ag-event", { opacity: 0, scale: 0.85 });
      tl.set(".ag-scan", { xPercent: 0, opacity: 0 });
      tl.set(".ag-key", { backgroundColor: "var(--color-bg)" });
      tl.call(() => {
        st.textContent = "idle";
      });

      tl.to(".ag-msg", {
        opacity: 1,
        y: 0,
        stagger: 0.16,
        duration: 0.5,
      });
      tl.to({}, { duration: 0.4 });

      // scan
      tl.call(() => {
        st.textContent = "reading dms";
      });
      tl.fromTo(
        ".ag-scan",
        { xPercent: 0, opacity: 0 },
        { xPercent: 360, opacity: 1, duration: 1.1, ease: "power1.inOut" },
      );
      tl.to(".ag-scan", { opacity: 0, duration: 0.25 }, ">-0.25");

      // found it
      tl.to(
        ".ag-key",
        {
          backgroundColor:
            "color-mix(in oklab, var(--color-accent) 14%, var(--color-bg))",
          duration: 0.4,
        },
        ">-0.1",
      );
      tl.call(() => {
        st.textContent = "found an event";
      });
      tl.to(".ag-chip", { opacity: 1, scale: 1, duration: 0.4 });
      tl.to({}, { duration: 0.35 });

      // hand off to the calendar
      tl.call(() => {
        st.textContent = "scheduling";
      });
      tl.to(".ag-chip", {
        y: 150,
        opacity: 0,
        scale: 0.85,
        duration: 0.9,
      });
      tl.to(
        ".ag-event",
        { opacity: 1, scale: 1, duration: 0.5 },
        ">-0.45",
      );
      tl.call(() => {
        st.textContent = "booked it";
      });

      tl.to({}, { duration: 2.4 });

      // reset, seamless repeat
      tl.to(
        [".ag-msg", ".ag-event"],
        { opacity: 0, duration: 0.5 },
      );
      tl.to(
        ".ag-key",
        { backgroundColor: "var(--color-bg)", duration: 0.3 },
        "<",
      );
      tl.to({}, { duration: 0.5 });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="relative mx-auto aspect-[4/5] w-full max-w-sm select-none"
    >
      {/* dms */}
      <div className="relative overflow-hidden rounded-bro border border-line bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-deep text-[10px] font-medium text-bg">
            SJ
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-ink">scarlett</span>
            <span className="text-[10px] text-soft">instagram · dms</span>
          </span>
          <span
            ref={status}
            className="ag-status ml-auto rounded-bro bg-bg px-2 py-1 text-[10px] tabular-nums text-soft"
          >
            idle
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="ag-msg flex">
            <div className="max-w-[82%] rounded-[14px] bg-bg px-3 py-2 text-[12px] leading-snug text-ink">
              still on for the gym saturday?
            </div>
          </div>
          <div className="ag-msg flex">
            <div className="ag-key max-w-[82%] rounded-[14px] bg-bg px-3 py-2 text-[12px] leading-snug text-ink">
              dinner thursday, 8pm? booked us somewhere
            </div>
          </div>
        </div>

        <div
          className="ag-scan pointer-events-none absolute inset-y-0 -left-1/4 w-1/4"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-accent) 26%, transparent), transparent)",
          }}
        />
      </div>

      <div
        className="ag-chip absolute left-6 top-[34%] rounded-bro bg-accent px-2.5 py-1 text-[11px] font-medium text-bg"
        style={{ opacity: 0 }}
      >
        dinner · thu 8pm
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
            className="grid"
            style={{ ...GRID, gridAutoRows: "2.5rem" }}
          >
            {HOURS.map((h) => (
              <Fragment key={h}>
                <div className="border-t border-line pr-1.5 pt-0.5 text-right text-[9px] leading-none text-soft">
                  {h}
                </div>
                {DAYS.map((d) => (
                  <div
                    key={d.dow}
                    className="border-l border-t border-line"
                  />
                ))}
              </Fragment>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute flex flex-col justify-center overflow-hidden rounded-[5px] border-l-2 border-line bg-surface px-2 text-[9px] leading-tight text-soft"
              style={{
                left: "calc(30px + 3 * ((100% - 30px) / 4) + 3px)",
                width: "calc((100% - 30px) / 4 - 6px)",
                top: "calc(2.5rem + 3px)",
                height: "calc(2.5rem - 6px)",
              }}
            >
              gym
            </div>

            <div
              className="ag-event absolute flex flex-col justify-center overflow-hidden rounded-[5px] border-l-2 border-accent px-2 leading-tight text-ink"
              style={{
                left: "calc(30px + 1 * ((100% - 30px) / 4) + 3px)",
                width: "calc((100% - 30px) / 4 - 6px)",
                top: "calc(2 * 2.5rem + 3px)",
                height: "calc(2.5rem - 6px)",
                backgroundColor:
                  "color-mix(in oklab, var(--color-accent) 20%, var(--color-bg))",
                opacity: 0,
              }}
            >
              <span className="text-[10px] font-semibold">dinner</span>
              <span className="text-[8.5px] text-soft">8 to 9 PM</span>
            </div>

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
    </div>
  );
}
