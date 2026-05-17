"use client";

// Magic UI DotPattern, adapted to this project: dropped the
// "@/lib/utils" cn dependency (inline join), uses the installed
// motion/react, dot color comes from currentColor so a tailwind text
// token tints it into the palette. glow defaults off (calm, FPS-safe).

import React, { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";

type DotPatternProps = React.SVGProps<SVGSVGElement> & {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  glow?: boolean;
};

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } =
          containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const cols = Math.ceil(dimensions.width / width);
  const dots = Array.from(
    { length: cols * Math.ceil(dimensions.height / height) },
    (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: col * width + cx + x,
        y: row * height + cy + y,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      };
    },
  );

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) =>
        glow ? (
          <motion.circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={cr}
            fill={`url(#${id}-gradient)`}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay: dot.delay,
              ease: "easeInOut",
            }}
          />
        ) : (
          // static: a plain SVG circle (no motion component) so a dense
          // full-screen field does not spawn thousands of motion nodes
          // and freeze the main thread.
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={cr}
            fill="currentColor"
          />
        ),
      )}
    </svg>
  );
}
