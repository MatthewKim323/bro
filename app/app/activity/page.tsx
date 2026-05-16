// activity: the pulse. proof bro is alive without opening the chat.
// stat tiles + the live log stream land in phase 5. see BRO_PLAN.md §8.5.

import { EmptyState } from "@/app/components/EmptyState";

export default function ActivityPanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="activity">
        bro&apos;s heartbeat shows here the moment it connects. nothing to
        report yet.
      </EmptyState>
    </div>
  );
}
