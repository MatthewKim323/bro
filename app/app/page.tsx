// chat: the default panel and the heart of the app. phase 2 stubs it
// with a calm, honest empty state, no fake composer (chat streaming
// lands in phase 3). the continuity note (rule 7) is rendered by the
// shell on this panel. see BRO_PLAN.md §8.1.

import { EmptyState } from "@/app/components/EmptyState";

export default function ChatPanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="chat">
        this is where you talk to bro. start a thread from the rail, or
        press ⌘K.
      </EmptyState>
    </div>
  );
}
