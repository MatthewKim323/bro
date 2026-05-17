"use client";

// the shell. built once, never re-thought per panel (BRO_PLAN.md §7).
// it owns the four things every panel shares: the sidebar, the status
// truth, ⌘K, and your threads. the active panel just renders into the
// canvas. fixed full-height: the body never scrolls, panels own their
// own scroll (and opt out of Lenis so a graph/log scrolls precisely).

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { useConnection } from "./useConnection";
import { useBroBusy } from "./activity";
import { useThreads } from "./useThreads";
import { useLocalString } from "./useLocalStore";
import { panelForPath } from "./nav";

const COLLAPSE_KEY = "bro.prefs.sidebarCollapsed.v1";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/app";
  const panel = panelForPath(pathname);
  const { status } = useConnection();
  // "thinking" overrides the connection word while bro is mid-reply
  // (UX rule 5: one liveness truth, and it never lies).
  const busy = useBroBusy();
  const shownStatus = busy ? "thinking" : status;
  const { threads, activeId, newThread, select } = useThreads();

  // sidebar preference persists via useSyncExternalStore (§9.4): no
  // mount effect, no hydration flash. server renders expanded, the
  // client reconciles to the saved width after hydrate.
  const [collapsedRaw, setCollapsedRaw] = useLocalString(COLLAPSE_KEY);
  const collapsed = collapsedRaw === "1";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleCollapsed = useCallback(
    () => setCollapsedRaw(collapsed ? "0" : "1"),
    [collapsed, setCollapsedRaw],
  );

  // ⌘K from anywhere (rule 4). esc is handled inside the palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        threads={threads}
        activeThreadId={activeId}
        onNewThread={newThread}
        onSelectThread={select}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <StatusBar
          status={shownStatus}
          panel={panel}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main
          data-lenis-prevent
          className="relative min-h-0 flex-1 overflow-y-auto"
        >
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewThread={newThread}
      />
    </div>
  );
}
