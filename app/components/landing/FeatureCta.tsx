"use client";

// the feature-section CTA. in-page (#...) targets go through
// ScrollSmoother (a native hash jump desyncs under the smoother, same
// reason the menu needed this); route targets use next/link. one
// bordered ghost button, matches the hero secondary.

import Link from "next/link";
import type { MouseEvent } from "react";
import { ScrollSmoother } from "gsap/ScrollSmoother";

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
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(target as Element, true, "top 84px");
      } else {
        (target as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };
    return (
      <a href={href} onClick={onClick} className={CLS}>
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
