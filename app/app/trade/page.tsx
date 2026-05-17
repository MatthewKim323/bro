// trade: the paper desk. real Dexscreener prices + real GeckoTerminal
// charts, a simulated SOL wallet, guarded paper fills. zero real funds
// or keys (BRO_PLAN.md §10). the engine is bro-local; jabby can call the
// same engine from chat in a later pass (§10.4).

import { Panel } from "@/app/components/Panel";
import { TradeDesk } from "./TradeDesk";

export default function TradePanel() {
  return (
    <div className="h-full p-6">
      <Panel title="trade · paper" flush className="h-full">
        <TradeDesk />
      </Panel>
    </div>
  );
}
