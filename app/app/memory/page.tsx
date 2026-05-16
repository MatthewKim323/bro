// memory: the readable companion to the graph, a quiet library. wired
// to gbrain in phase 4 (it shows memory; jabby writes it). see
// BRO_PLAN.md §8.3.

import { EmptyState } from "@/app/components/EmptyState";

export default function MemoryPanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="memory">
        everything bro knows, made readable. pick a page or search it.
      </EmptyState>
    </div>
  );
}
