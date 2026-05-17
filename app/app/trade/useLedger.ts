"use client";

// the sim wallet, bro-owned and local (same useSyncExternalStore
// persistence as threads, §9.4). it holds only a seed amount and a list
// of fills. there is no key, no RPC, no real SOL. buy/sell run the pure
// engine, and on success persist the new ledger. the FillResult is
// returned so the desk can show a guardrail sentence (rule 6).

import { useCallback } from "react";
import { useLocalJSON } from "@/app/app/_shell/useLocalStore";
import type { Mover } from "@/lib/trading/discovery";
import {
  EMPTY_LEDGER,
  buy as engineBuy,
  sell as engineSell,
  type FillResult,
  type Ledger,
} from "@/lib/trading/engine";

const KEY = "bro.ledger.v1";

export function useLedger() {
  const [ledger, setLedger] = useLocalJSON<Ledger>(KEY, EMPTY_LEDGER);

  const buy = useCallback(
    (mover: Mover, sizeSol: number, solUsd: number | null): FillResult => {
      const r = engineBuy(ledger, mover, sizeSol, solUsd);
      if (r.ok) setLedger(r.ledger);
      return r;
    },
    [ledger, setLedger],
  );

  const sell = useCallback(
    (mover: Mover, tokens: number, solUsd: number | null): FillResult => {
      const r = engineSell(ledger, mover, tokens, solUsd);
      if (r.ok) setLedger(r.ledger);
      return r;
    },
    [ledger, setLedger],
  );

  const reset = useCallback(() => setLedger(EMPTY_LEDGER), [setLedger]);

  return { ledger, buy, sell, reset };
}
