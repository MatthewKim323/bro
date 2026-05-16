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
          <span className="text-[12px] text-soft">
            phase 4 wires this to gbrain
          </span>
        }
      >
        <div className="relative h-full w-full overflow-hidden">
          <GraphCanvas />

          {/* the §8.2 teaching line. low-contrast, out of the center so
              the constellation reads, present so the panel never sits
              silent (rule 3). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-8 pb-10 text-center">
            <p className="bro-display max-w-md text-xl leading-snug text-ink/85">
              this is everything bro knows. give it a moment to draw
              itself.
            </p>
            <p className="text-[12px] text-soft">
              reads gbrain directly, so it stays fast even mid-conversation
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
