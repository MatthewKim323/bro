"use client";

// a live, real read off Solana mainnet. proves the Solana integration
// is not decoration: the slot ticks up because it is the actual chain.

import { useEffect, useState } from "react";
import { Label } from "@/app/components/Label";

type Pulse = {
  ok: boolean;
  slot: number | null;
  epoch: number | null;
  host: string;
};

export function SolanaPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/solana/pulse", { cache: "no-store" });
        const data = (await res.json()) as Pulse;
        if (alive) setPulse(data);
      } catch {
        /* keep last good value */
      }
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const live = pulse?.ok;

  return (
    <section className="relative mx-auto w-full max-w-6xl px-8 sm:px-16">
      <div className="flex flex-col gap-4 rounded-bro border border-line bg-surface/60 px-8 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              live ? "bg-accent" : "bg-soft/50"
            }`}
            aria-hidden
          />
          <Label>{live ? "solana mainnet, live" : "reaching solana..."}</Label>
        </div>
        <div className="flex items-center gap-8 font-mono text-sm text-ink">
          <span>
            <span className="text-soft">slot </span>
            {pulse?.slot != null ? pulse.slot.toLocaleString() : "..."}
          </span>
          <span>
            <span className="text-soft">epoch </span>
            {pulse?.epoch ?? "..."}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-soft">
        a real getEpochInfo call against Solana mainnet, the chain bro
        paper-trades on.
      </p>
    </section>
  );
}
