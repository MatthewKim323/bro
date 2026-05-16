// trade: the paper desk. fake wallet, real observed prices, zero real
// funds or keys (BRO_PLAN.md §10). the movers feed (real Solana prices
// bro watches) is live; the fill engine + positions land in phase 6.
// §8.6.

import { Panel } from "@/app/components/Panel";
import { Watchlist } from "./Watchlist";

export default function TradePanel() {
  return (
    <div className="h-full p-6">
      <Panel title="movers · paper" className="h-full">
        <Watchlist />
        <p className="mt-8 border-t border-line pt-4 text-xs text-soft">
          real prices, paper only: no wallet, no keys, no real money.
          placing trades and positions land in phase 6.
        </p>
      </Panel>
    </div>
  );
}
