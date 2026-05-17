// the panels. single source of truth for sidebar nav, the status bar
// title, and the command palette. order is deliberate: the things you
// do most, first. see BRO_PLAN.md §5 / §7.

export type PanelKey = "chat" | "graph" | "trade" | "settings";

export type PanelDef = {
  key: PanelKey;
  label: string;
  href: string;
  /** one-line hint for the command palette */
  hint: string;
};

export const PANELS: PanelDef[] = [
  { key: "chat", label: "chat", href: "/app", hint: "talk to bro" },
  { key: "graph", label: "graph", href: "/app/graph", hint: "watch its mind" },
  { key: "trade", label: "trade", href: "/app/trade", hint: "the paper desk" },
  { key: "settings", label: "settings", href: "/app/settings", hint: "connection and more" },
];

/** which panel a pathname belongs to. /app is chat; deeper paths match by prefix. */
export function panelForPath(pathname: string): PanelKey {
  if (pathname === "/app" || pathname === "/app/") return "chat";
  const seg = pathname.replace(/^\/app\/?/, "").split("/")[0];
  const match = PANELS.find((p) => p.key === seg);
  return match ? match.key : "chat";
}
