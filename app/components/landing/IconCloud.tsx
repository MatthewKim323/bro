"use client";

// original rotating icon sphere (not Magic UI's source). icons are
// placed on a fibonacci sphere, auto-spins calmly, and leans toward
// the pointer. pure DOM transforms (no canvas, no WebGL), so it is
// FPS-safe. every icon renders in an identical fixed box, so sizes are
// consistent regardless of the source art. honors reduced motion
// (static, no spin, no listeners).

import { useRef, useEffect } from "react";

export function IconCloud({ images }: { images: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const n = images.length;
    if (!n) return;

    // fibonacci sphere
    const pts = Array.from({ length: n }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
      };
    });

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let ay = 0.7;
    let ax = -0.45;
    let velY = 0.16; // calm auto-spin (rad/s)
    let velX = 0;
    let tgtVelY = 0.16;
    let tgtVelX = 0;
    let hovering = false;

    const draw = () => {
      const w = container.clientWidth;
      const R = w * 0.4;
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y1 = p.y;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;
        const k = (z2 + 1) / 2; // 0 back .. 1 front
        const s = 0.45 + 0.55 * k;
        const el = els.current[i];
        if (!el) continue;
        el.style.transform = `translate(-50%, -50%) translate(${x1 * R}px, ${y2 * R}px) scale(${s})`;
        el.style.opacity = `${0.3 + 0.7 * k}`;
        el.style.zIndex = `${Math.round(k * 100)}`;
      }
    };

    if (reduce) {
      draw();
      return;
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tgtVelY = hovering ? tgtVelY : 0.16;
      tgtVelX = hovering ? tgtVelX : 0;
      velY += (tgtVelY - velY) * Math.min(dt * 4, 1);
      velX += (tgtVelX - velX) * Math.min(dt * 4, 1);
      ay += velY * dt;
      ax += velX * dt;
      ax = Math.max(-1.15, Math.min(1.15, ax));
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      hovering = true;
      tgtVelY = nx * 1.3;
      tgtVelX = -ny * 1.0;
    };
    const onLeave = () => {
      hovering = false;
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [images]);

  return (
    <div
      ref={root}
      aria-hidden
      className="relative aspect-square w-full select-none"
    >
      {images.map((src, i) => (
        <div
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 grid h-10 w-10 place-items-center"
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="h-7 w-7 object-contain"
          />
        </div>
      ))}
    </div>
  );
}
