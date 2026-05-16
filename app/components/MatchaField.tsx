// the signature backdrop: a soft noisy matcha gradient, deep sage at
// the edges melting into cream toward the center. bro's own, designed
// from scratch. see docs/BRO_PLAN.md §3.3.
//
// it is absolute, so the parent must be `relative`. it never holds
// text directly; content sits in a sibling above it.

type MatchaFieldProps = {
  /** "soft" is a gentler wash for panels/empty-states; default is hero-strength */
  variant?: "default" | "soft";
  className?: string;
};

export function MatchaField({
  variant = "default",
  className = "",
}: MatchaFieldProps) {
  const cls =
    variant === "soft" ? "bro-matcha-field bro-matcha-field--soft" : "bro-matcha-field";
  return <div aria-hidden className={`${cls} ${className}`} />;
}
