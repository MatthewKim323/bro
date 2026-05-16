// the app's content container. one radius, a single hairline border,
// zero shadow (depth is tone + grain, never a blur cloud). it breathes:
// generous interior padding. optional tracked-label title row.
// see BRO_PLAN.md §3.5 / §3.7.

import type { ReactNode } from "react";
import { Label } from "@/app/components/Label";

type PanelProps = {
  children: ReactNode;
  /** tracked-uppercase title shown in the header row */
  title?: string;
  /** right-aligned header slot (filters, actions) */
  action?: ReactNode;
  /** drop interior padding when the child manages its own (e.g. a graph canvas) */
  flush?: boolean;
  className?: string;
};

export function Panel({
  children,
  title,
  action,
  flush = false,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-bro border border-line bg-bg ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          {title ? <Label>{title}</Label> : <span />}
          {action}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${flush ? "" : "p-8"}`}>{children}</div>
    </section>
  );
}
