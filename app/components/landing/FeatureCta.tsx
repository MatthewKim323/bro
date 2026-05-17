// the feature-section CTA. one bordered ghost button, matches the hero
// secondary. in-page (#...) targets are now plain native anchors: the
// page scrolls on the compositor (globals.css html { scroll-behavior:
// smooth } + scroll-margin-top), no JS scroll engine involved. route
// targets use next/link.

import Link from "next/link";

const CLS =
  "mt-8 inline-flex w-fit items-center gap-1.5 rounded-bro border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-200 ease-[var(--ease-bro)] hover:bg-surface";

export function FeatureCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={CLS}>
        {label}
        <span aria-hidden>&rsaquo;</span>
      </a>
    );
  }
  return (
    <Link href={href} className={CLS}>
      {label}
      <span aria-hidden>&rsaquo;</span>
    </Link>
  );
}
