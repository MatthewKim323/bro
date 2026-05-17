// knowledge graph (BRO_PLAN.md §8.2). the competition showpiece. phase 2
// stands up its identity: the calm "drawing itself" canvas inside the
// panel chrome. the interactive explorer over gbrain's pages (search,
// filter, click-to-reader, worker sim, LOD) is phase 4 and is stated
// honestly here, never faked (rule 6, truthful copy).

import { Panel } from "@/app/components/Panel";
import { GraphCanvas } from "./GraphCanvas";

export default function GraphPanel() {
  return (
    <div className="h-full p-6">
      <Panel
        title="knowledge graph"
        flush
        className="h-full"
        action={
          <span className="text-[12px] text-soft">live, from gbrain</span>
        }
      >
        <div className="relative h-full w-full overflow-hidden">
          <GraphCanvas />
        </div>
      </Panel>
    </div>
  );
}
