// the tracked uppercase eyebrow. a brand signature: tiny, letter-spaced,
// soft sage. used for section eyebrows, panel titles, metadata.
// see BRO_PLAN.md §3.4.

import type { ElementType, ReactNode } from "react";

type LabelProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

export function Label({ children, as: Tag = "span", className = "" }: LabelProps) {
  return <Tag className={`bro-label ${className}`}>{children}</Tag>;
}
