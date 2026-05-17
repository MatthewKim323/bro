// "powered by" strip for the hero. real brand marks via simple-icons,
// rendered monochrome (fill: currentColor) and tinted to the on-brand
// sage so they read on the cream hero. backboard uses its official svg
// (public/backboard-mark.svg, white plate stripped) recolored via a CSS
// mask so it matches the set. the marquee is CSS-only; the set is
// duplicated once for a seamless wrap. every item is genuinely in repo.

import type { ReactNode } from "react";
import {
  siTypescript,
  siNextdotjs,
  siReact,
  siTailwindcss,
  siGreensock,
  siFramer,
  siSolana,
  siMongodb,
  siBun,
} from "simple-icons";
import { Label } from "@/app/components/Label";
import "./TechStack.css";

type Mark =
  | { title: string; path: string }
  | { title: string; node: ReactNode };

const ICONS = [
  siTypescript,
  siNextdotjs,
  siReact,
  siTailwindcss,
  siGreensock,
  siFramer,
  siSolana,
];
const TAIL = [siMongodb, siBun];

const STACK: Mark[] = [
  ...ICONS.map((m) => ({ title: m.title, path: m.path })),
  {
    title: "Backboard",
    node: (
      <span className="tech-bb" role="img" aria-label="Backboard" />
    ),
  },
  ...TAIL.map((m) => ({ title: m.title, path: m.path })),
];

export function TechStack() {
  return (
    <div className="mt-10 max-w-md">
      <Label>powered by</Label>
      <div className="tech-strip mt-4">
        <div className="tech-track">
          {[...STACK, ...STACK].map((m, i) => (
            <span
              key={i}
              className="tech-item"
              aria-hidden={i >= STACK.length}
            >
              {"node" in m ? (
                m.node
              ) : (
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="tech-icon"
                  aria-label={m.title}
                >
                  <path d={m.path} fill="currentColor" />
                </svg>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
