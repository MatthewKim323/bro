// settings: quiet, one column of choices, a live chat preview. icon,
// chat skin/colors, custom vocabulary, filtered words. everything is
// wired for real and persists locally (BRO_PLAN.md §8.7).

import { Panel } from "@/app/components/Panel";
import { SettingsForm } from "./SettingsForm";

export default function SettingsPanel() {
  return (
    <div className="h-full p-6">
      <Panel title="settings" className="h-full">
        <SettingsForm />
      </Panel>
    </div>
  );
}
