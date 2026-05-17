"use client";

// "remembers everything": a self-running loop. an irregular living
// node cloud (never a ball) breathes, gathers into a loose knot, then
// blooms into well-spaced labeled memory bubbles, holds, and folds
// back, forever. one GSAP timeline + continuous jitter, pure SVG (no
// ScrollTrigger so it cannot silently fail, no WebGL so it is
// FPS-safe). palette tones only. labels are illustrative examples of
// what bro remembers. honors prefers-reduced-motion (one static map).

import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { BroMark } from "./BroMark";
import "./MemoryGraph.css";

const TONE = [
  "var(--color-accent)",
  "var(--color-sage-deep)",
  "var(--color-matcha)",
  "var(--color-soft)",
];

type Spec = {
  label?: string;
  mesh: [number, number];
  final: [number, number];
};

// 0..100 x 0..78 viewBox. mesh is a deliberately irregular, asymmetric
// scatter. labeled nodes bloom into spaced bubbles; the rest fade to
// faint background dots so the 8 bubbles never overlap.
const SPECS: Spec[] = [
  { mesh: [12, 18], final: [8, 9] },
  { label: "date w/ scarlett", mesh: [30, 9], final: [27, 12] },
  { mesh: [49, 16], final: [50, 7] },
  { label: "check pumpfun coins", mesh: [70, 11], final: [73, 14] },
  { mesh: [88, 22], final: [93, 11] },
  { label: "walk the dog", mesh: [20, 38], final: [21, 31] },
  { label: "ship the launch", mesh: [41, 33], final: [31, 50] },
  { label: "groceries run", mesh: [62, 30], final: [67, 33] },
  { label: "mom's bday fri", mesh: [82, 42], final: [74, 52] },
  { mesh: [14, 58], final: [8, 72] },
  { label: "the bros, 9pm", mesh: [35, 55], final: [24, 69] },
  { mesh: [56, 52], final: [52, 76] },
  { label: "rent due friday", mesh: [76, 62], final: [67, 70] },
  { mesh: [44, 70], final: [93, 74] },
];

const EDGES: [number, number][] = [
  [0, 5], [0, 1], [1, 2], [2, 3], [3, 4], [1, 6], [2, 6], [6, 7],
  [7, 3], [7, 8], [8, 4], [5, 6], [5, 9], [6, 10], [6, 11], [10, 9],
  [10, 11], [11, 7], [11, 12], [12, 8], [10, 13], [13, 11], [9, 13],
];

const CENTER: [number, number] = [48, 38];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function MemoryGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pillRefs = useRef<(SVGGElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const broRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    // a loose, randomized knot offset per node so the collapse is a
    // cluster, never a single-point pinch.
    const knot = SPECS.map(() => [rand(-7, 7), rand(-6, 6)] as const);

    const N = SPECS.map((s) => ({
      cx: s.mesh[0],
      cy: s.mesh[1],
      s: 0,
      m: 0,
      a: 1,
      jx: 0,
      jy: 0,
    }));
    const E = { o: 0 };

    const paint = () => {
      for (let i = 0; i < N.length; i++) {
        const n = N[i];
        const g = groupRefs.current[i];
        if (g)
          g.setAttribute(
            "transform",
            `translate(${n.cx + n.jx} ${n.cy + n.jy}) scale(${n.s})`,
          );
        const d = dotRefs.current[i];
        if (d) d.setAttribute("opacity", `${(1 - n.m) * n.a}`);
        const p = pillRefs.current[i];
        if (p) p.setAttribute("opacity", `${n.m}`);
      }
      for (let e = 0; e < EDGES.length; e++) {
        const ln = lineRefs.current[e];
        if (!ln) continue;
        const a = N[EDGES[e][0]];
        const b = N[EDGES[e][1]];
        ln.setAttribute("x1", `${a.cx + a.jx}`);
        ln.setAttribute("y1", `${a.cy + a.jy}`);
        ln.setAttribute("x2", `${b.cx + b.jx}`);
        ln.setAttribute("y2", `${b.cy + b.jy}`);
        ln.setAttribute("opacity", `${E.o}`);
      }
    };

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      for (let i = 0; i < N.length; i++) {
        N[i].cx = SPECS[i].final[0];
        N[i].cy = SPECS[i].final[1];
        N[i].s = 1;
        N[i].m = SPECS[i].label ? 1 : 0;
        N[i].a = SPECS[i].label ? 1 : 0.4;
      }
      E.o = 0.32;
      paint();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.ticker.add(paint);

      // continuous, slow, large-ish breathing so the cloud constantly
      // changes shape (never reads as a fixed blob).
      N.forEach((n) => {
        const drift = () => {
          gsap.to(n, {
            jx: rand(-2.2, 2.2),
            jy: rand(-2, 2),
            duration: rand(2.8, 4.6),
            ease: "sine.inOut",
            onComplete: drift,
          });
        };
        drift();
      });

      // intro (once): pop into the mesh state.
      const intro = gsap.timeline();
      intro.to(E, { o: 0.4, duration: 0.8 }, 0);
      intro.to(
        N,
        {
          s: 1,
          duration: 0.8,
          ease: "back.out(1.5)",
          stagger: { each: 0.04, from: "random" },
        },
        0,
      );

      // loop: STARTS and ENDS at the identical mesh state
      // (positions=mesh, s=1, m=0, a=1, E.o=0.4) so repeat is seamless.
      const loop = gsap.timeline({
        repeat: -1,
        paused: true,
        defaults: { ease: "power1.inOut" },
      });

      const broEl = broRef.current;
      gsap.set(broEl, { opacity: 0, scale: 0.7 });

      // one blink, the exact same one as the hover blink (drives the
      // same @keyframes bro-blink via a class). a double rAF after
      // removing the class guarantees the browser paints the
      // no-animation state first, so it actually restarts every loop
      // (the sync offsetWidth trick was unreliable inside the ticker).
      const blinkOnce = () => {
        const m = broEl?.querySelector<HTMLElement>(".bro-mark");
        if (!m) return;
        m.classList.remove("bro-blink-now");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => m.classList.add("bro-blink-now"));
        });
      };

      loop.to({}, { duration: 1.8 }); // live mesh beat

      // gather into a loose knot (cluster, not a point)
      loop.add("knot");
      SPECS.forEach((_, i) => {
        loop.to(
          N[i],
          {
            cx: CENTER[0] + knot[i][0],
            cy: CENTER[1] + knot[i][1],
            s: 0.62,
            duration: 1.1,
          },
          "knot+=" + i * 0.018,
        );
      });
      loop.to(E, { o: 0.07, duration: 0.9 }, "knot+=0.1");

      // bro pops in over the collapsing knot and blinks once
      loop.to(
        broEl,
        { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.5)" },
        "knot+=0.15",
      );
      loop.call(blinkOnce, undefined, "knot+=1.05");

      // bloom: labeled -> spaced bubbles, others -> faint bg dots
      loop.add("bloom");
      // bro vanishes and the bubbles spit out from where he was
      loop.to(
        broEl,
        { opacity: 0, scale: 0.82, duration: 0.4, ease: "power2.in" },
        "bloom+=0.25",
      );
      SPECS.forEach((sp, i) => {
        loop.to(
          N[i],
          {
            cx: sp.final[0],
            cy: sp.final[1],
            s: sp.label ? 1 : 0.5,
            a: sp.label ? 1 : 0.32,
            duration: 1.15,
          },
          "bloom+=" + i * 0.035,
        );
      });
      loop.to(
        N.filter((_, i) => SPECS[i].label),
        { m: 1, duration: 0.6, stagger: 0.04 },
        "bloom+=0.45",
      );
      loop.to(E, { o: 0.34, duration: 1 }, "bloom+=0.3");

      loop.to({}, { duration: 2.8 }); // hold the memory map

      // fold labels, return to the living mesh (== loop start state)
      loop.to(N, { m: 0, duration: 0.5, stagger: 0.03 }, ">");
      loop.add("back");
      SPECS.forEach((sp, i) => {
        loop.to(
          N[i],
          {
            cx: sp.mesh[0],
            cy: sp.mesh[1],
            s: 1,
            a: 1,
            duration: 1.15,
          },
          "back+=" + i * 0.03,
        );
      });
      loop.to(E, { o: 0.4, duration: 1 }, "back");
      loop.to({}, { duration: 1.6 }); // settle, then seamless repeat

      intro.eventCallback("onComplete", () => loop.play(0));
    }, svgRef);

    return () => {
      gsap.ticker.remove(paint);
      ctx.revert();
    };
  }, []);

  return (
    <div aria-hidden className="relative aspect-[5/4] w-full select-none">
      <svg
        ref={svgRef}
        className="mem-graph"
        viewBox="0 0 100 78"
        preserveAspectRatio="xMidYMid meet"
      >
        <g stroke="var(--color-sage-deep)" strokeWidth="0.36">
          {EDGES.map((_, e) => (
            <line
              key={e}
              ref={(el) => {
                lineRefs.current[e] = el;
              }}
              opacity="0"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {SPECS.map((sp, i) => {
          const w = sp.label ? sp.label.length * 1.18 + 5 : 0;
          return (
            <g
              key={i}
              ref={(el) => {
                groupRefs.current[i] = el;
              }}
            >
              <circle
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                r="1.7"
                fill={TONE[i % TONE.length]}
              />
              {sp.label && (
                <g
                  ref={(el) => {
                    pillRefs.current[i] = el;
                  }}
                  opacity="0"
                >
                  <rect
                    x={-w / 2}
                    y={-2.5}
                    width={w}
                    height={5}
                    rx={2.5}
                    fill="var(--color-surface)"
                    stroke="var(--color-line)"
                    strokeWidth="0.18"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="2.5"
                    fill="var(--color-ink)"
                  >
                    {sp.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* bro covers the collapsed knot, blinks once, then the bubbles
          spit out from where he was. */}
      <div
        ref={broRef}
        aria-hidden
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <BroMark className="h-2/5 w-auto aspect-square" />
      </div>
    </div>
  );
}
