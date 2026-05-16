// trade: the paper desk. fake wallet, real observed prices, zero real
// funds or keys (BRO_PLAN.md §10). discovery + the fill engine land in
// phase 6. the empty state already tells the honest story. §8.6.

import { EmptyState } from "@/app/components/EmptyState";

export default function TradePanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="trade · paper">
        no positions yet. bro is watching the movers. pick one, or ask
        bro to.
      </EmptyState>
    </div>
  );
}
