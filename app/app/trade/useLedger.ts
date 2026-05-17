"use client";

// the sim wallet, now SERVER-backed (was browser localStorage, which
// jabby could never reach). the hook polls the shared server ledger and
// places orders through /api/trade/order, the exact same endpoint jabby
// hits from chat, so the desk and jabby move one wallet through one
// engine + guardrails. paper only, no funds, no keys. §8.6 / §10.4.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Mover } from "@/lib/trading/discovery";
import { EMPTY_LEDGER, type Ledger } from "@/lib/trading/engine";

export type OrderOutcome = { ok: boolean; message: string };

export function useLedger() {
  const [ledger, setLedger] = useState<Ledger>(EMPTY_LEDGER);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/trade/ledger", { cache: "no-store" });
      const l = (await res.json()) as Ledger;
      // setState is after the await, never synchronously in an effect
      if (alive.current && l && Array.isArray(l.fills)) setLedger(l);
    } catch {
      /* keep last good */
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    // local async tick (mirrors useConnection): the effect never
    // setStates synchronously, only after the awaited fetch inside.
    async function tick() {
      try {
        const res = await fetch("/api/trade/ledger", { cache: "no-store" });
        const l = (await res.json()) as Ledger;
        if (alive.current && l && Array.isArray(l.fills)) setLedger(l);
      } catch {
        /* keep last good */
      }
    }
    tick();
    const id = setInterval(tick, 6_000);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, []);

  const order = useCallback(
    async (
      side: "buy" | "sell",
      mover: Mover,
      sizeSol?: number,
    ): Promise<OrderOutcome> => {
      try {
        const res = await fetch("/api/trade/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, query: mover.mint, sizeSol }),
        });
        const d = (await res.json()) as OrderOutcome;
        await refresh();
        return d;
      } catch {
        return { ok: false, message: "could not reach the desk." };
      }
    },
    [refresh],
  );

  const buy = useCallback(
    (mover: Mover, sizeSol: number) => order("buy", mover, sizeSol),
    [order],
  );
  const sell = useCallback(
    (mover: Mover) => order("sell", mover),
    [order],
  );
  const reset = useCallback(async () => {
    try {
      await fetch("/api/trade/reset", { method: "POST" });
    } catch {
      /* non-fatal */
    }
    await refresh();
  }, [refresh]);

  return { ledger, buy, sell, reset };
}
