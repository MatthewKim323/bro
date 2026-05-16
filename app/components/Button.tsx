// the one button. forest primary (the single loud thing per view,
// UX rule 1) or quiet ghost. one radius, no shadow, calm hover
// (opacity OR scale, never both). see BRO_PLAN.md §3.6 / §3.7.
//
// not a client component itself: it just forwards props, so it works
// inside server and client components alike.

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-bro text-sm font-medium " +
  "transition-[opacity,background-color,color] duration-200 ease-[var(--ease-bro)] " +
  "disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-accent/40";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-bg px-6 py-3 hover:opacity-85",
  ghost:
    "bg-transparent text-soft px-4 py-2 hover:text-ink underline underline-offset-4 decoration-line",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
