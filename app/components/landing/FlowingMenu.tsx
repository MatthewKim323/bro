"use client";

// React Bits FlowingMenu, adapted to this project: TypeScript, our
// gsap, palette-token colors, lowercase Fraunces (see FlowingMenu.css),
// an onSelect hook so item clicks route through ScrollSmoother instead
// of a native hash jump, an optional image (a small accent dot is used
// when there is none), and a prefers-reduced-motion guard (no auto
// marquee, no hover reveal). the signature edge-aware reveal is kept.

import { useRef, useEffect, useState, type MouseEvent } from "react";
import { gsap } from "gsap";
import "./FlowingMenu.css";

type FlowItem = {
  text: string;
  href: string;
  image?: string;
  color?: string;
};

type FlowingMenuProps = {
  items?: FlowItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  onSelect?: (href: string) => void;
};

export function FlowingMenu({
  items = [],
  speed = 18,
  textColor = "var(--color-ink)",
  bgColor = "transparent",
  marqueeBgColor = "var(--color-accent)",
  marqueeTextColor = "var(--color-bg)",
  borderColor = "var(--color-line)",
  onSelect,
}: FlowingMenuProps) {
  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className="menu">
        {items.map((it) => (
          <MenuItem
            key={it.href + it.text}
            {...it}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </div>
  );
}

function MenuItem({
  href,
  text,
  image,
  color,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  onSelect,
}: FlowItem & {
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
  onSelect?: (href: string) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animationDefaults = { duration: 0.6, ease: "power4.out" };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const dx = x - x2;
    const dy = y - y2;
    return dx * dx + dy * dy;
  };

  const findClosestEdge = (
    mx: number,
    my: number,
    w: number,
    h: number,
  ) =>
    distMetric(mx, my, w / 2, 0) < distMetric(mx, my, w / 2, h)
      ? "top"
      : "bottom";

  useEffect(() => {
    const calc = () => {
      const part =
        marqueeInnerRef.current?.querySelector<HTMLElement>(
          ".marquee__part",
        );
      if (!part) return;
      const cw = part.offsetWidth;
      if (!cw) return;
      const needed = Math.ceil(window.innerWidth / cw) + 2;
      setRepetitions(Math.max(4, needed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [text, image]);

  useEffect(() => {
    if (reduce) return;
    const setup = () => {
      const part =
        marqueeInnerRef.current?.querySelector<HTMLElement>(
          ".marquee__part",
        );
      if (!part || !marqueeInnerRef.current) return;
      const cw = part.offsetWidth;
      if (cw === 0) return;
      animationRef.current?.kill();
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -cw,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };
    const timer = setTimeout(setup, 50);
    return () => {
      clearTimeout(timer);
      animationRef.current?.kill();
    };
  }, [text, image, repetitions, speed, reduce]);

  const handleEnter = (ev: MouseEvent<HTMLAnchorElement>) => {
    if (
      reduce ||
      !itemRef.current ||
      !marqueeRef.current ||
      !marqueeInnerRef.current
    )
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );
    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(
        marqueeInnerRef.current,
        { y: edge === "top" ? "101%" : "-101%" },
        0,
      )
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleLeave = (ev: MouseEvent<HTMLAnchorElement>) => {
    if (
      reduce ||
      !itemRef.current ||
      !marqueeRef.current ||
      !marqueeInnerRef.current
    )
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );
    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(
        marqueeInnerRef.current,
        { y: edge === "top" ? "101%" : "-101%" },
        0,
      );
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#") || onSelect) {
      e.preventDefault();
      onSelect?.(href);
    }
  };

  return (
    <div className="menu__item" ref={itemRef} style={{ borderColor }}>
      <a
        className="menu__item-link"
        href={href}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ color: color ?? textColor }}
      >
        {text}
      </a>
      <div
        className="marquee"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="marquee__inner-wrap">
          <div
            className="marquee__inner"
            ref={marqueeInnerRef}
            aria-hidden="true"
          >
            {Array.from({ length: repetitions }).map((_, idx) => (
              <div
                className="marquee__part"
                key={idx}
                style={{ color: marqueeTextColor }}
              >
                <span>{text}</span>
                {image ? (
                  <div
                    className="marquee__img"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                ) : (
                  <span className="marquee__dot" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowingMenu;
