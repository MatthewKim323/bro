// the bridge gate. /app is the localhost surface that talks to jabby; in
// the public build it must not exist. this is "off by construction": a
// server-side notFound(), not a promise in copy. see BRO_PLAN.md §5.
//
// the shell itself is a client component (it owns interactivity); this
// layout stays a server component so the gate runs before any of it
// reaches the browser.

import { notFound } from "next/navigation";
import { isAppEnabled } from "@/lib/mode";
import { AppShell } from "./_shell/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAppEnabled()) notFound();
  return <AppShell>{children}</AppShell>;
}
