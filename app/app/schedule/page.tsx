// schedule: what bro does on its own, made visible and calm. jobs +
// heartbeat land in phase 5. see BRO_PLAN.md §8.4.

import { EmptyState } from "@/app/components/EmptyState";

export default function SchedulePanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="schedule">
        bro can check in on a schedule. nothing runs yet. add the first
        one.
      </EmptyState>
    </div>
  );
}
