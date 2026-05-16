// no blank panels, ever (UX rule 3). every empty surface is a soft
// matcha field + one tracked label + one teaching sentence + at most
// one action. it tells you what this becomes and how to start.
// see BRO_PLAN.md §4.3 / §3.7.

import type { ReactNode } from "react";
import { MatchaField } from "@/app/components/MatchaField";
import { Label } from "@/app/components/Label";

type EmptyStateProps = {
  /** tiny tracked eyebrow, e.g. the panel name */
  eyebrow?: string;
  /** the one sentence that teaches what this surface becomes */
  children: ReactNode;
  /** at most one action (UX rule 1) */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  eyebrow,
  children,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-bro ${className}`}
    >
      <MatchaField variant="soft" />
      <div className="relative z-10 max-w-md px-8 text-center">
        {eyebrow && <Label className="mb-5 block">{eyebrow}</Label>}
        <p className="bro-display text-2xl leading-snug text-ink">{children}</p>
        {action && <div className="mt-8 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
