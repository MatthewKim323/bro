// settings: quiet, one column, human sentences over forms. connection /
// heartbeat / appearance / about land in phase 5. see BRO_PLAN.md §8.7.

import { EmptyState } from "@/app/components/EmptyState";

export default function SettingsPanel() {
  return (
    <div className="h-full p-6">
      <EmptyState eyebrow="settings">
        connection, heartbeat, and what stays local-only. nothing to set
        up yet.
      </EmptyState>
    </div>
  );
}
