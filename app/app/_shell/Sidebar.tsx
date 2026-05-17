"use client";

// the left rail. chatgpt-familiar so it needs zero learning, but quieter
// and warmer. top = panel nav. below a hairline = your threads (they
// organize YOUR view; jabby still remembers across all of them). bottom
// = identity + collapse. collapsed = icons only. see BRO_PLAN.md §7.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BroMark } from "@/app/components/landing/BroMark";
import { PANELS, panelForPath } from "./nav";
import { Glyph } from "./Glyph";
import { groupThreads, type Thread } from "./useThreads";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  threads: Thread[];
  activeThreadId: string | null;
  onNewThread: () => void;
  onSelectThread: (id: string) => void;
};

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  threads,
  activeThreadId,
  onNewThread,
  onSelectThread,
}: SidebarProps) {
  const pathname = usePathname() ?? "/app";
  const router = useRouter();
  const active = panelForPath(pathname);
  const onChat = active === "chat";
  const { today, earlier } = groupThreads(threads);

  function openThread(id: string) {
    onSelectThread(id);
    if (!onChat) router.push("/app");
  }

  return (
    <nav
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-r border-line transition-[width] duration-300 ease-[var(--ease-bro)] ${
        collapsed ? "w-[68px]" : "w-[264px]"
      }`}
      aria-label="bro navigation"
    >
      {/* the rail rests on a soft sage field, deepest at the foot where
          identity sits, melting to clean cream by the nav + threads so
          text always lands on calm ground (field never behind reading
          copy). the shell's grain prints it so it reads, not digital. */}
      <div aria-hidden className="bro-rail-field" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
      {/* wordmark */}
      <div className="flex h-14 shrink-0 items-center border-b border-line px-5">
        <Link
          href="/"
          aria-label="bro, back to the landing page"
          className="bro-brand flex items-center gap-1.5"
        >
          <BroMark className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <span className="bro-display text-2xl leading-none text-ink">
              bro
            </span>
          )}
        </Link>
      </div>

      {/* panel nav */}
      <div className="px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {PANELS.map((p) => {
            const isActive = active === p.key;
            return (
              <li key={p.key}>
                <Link
                  href={p.href}
                  title={collapsed ? p.label : undefined}
                  className={`group relative flex items-center gap-3 rounded-bro px-3 py-2 text-sm transition-colors duration-200 ease-[var(--ease-bro)] ${
                    isActive
                      ? "bg-surface text-ink"
                      : "text-soft hover:text-ink"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {/* the one loud thing on the rail: a hairline accent
                      tick marks the active panel. nothing else shouts. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent"
                    />
                  )}
                  <span
                    className={
                      isActive ? "text-accent" : "text-soft group-hover:text-ink"
                    }
                  >
                    <Glyph name={p.key} />
                  </span>
                  {!collapsed && <span>{p.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* threads: only fully relevant on chat; dims back elsewhere */}
      {!collapsed && (
        <div
          className={`flex min-h-0 flex-1 flex-col border-t border-line px-3 pt-4 transition-opacity duration-300 ${
            onChat ? "opacity-100" : "opacity-45"
          }`}
        >
          <div className="flex items-center justify-between px-2">
            <span className="bro-label">threads</span>
            <button
              type="button"
              onClick={onNewThread}
              className="rounded-bro px-1.5 text-soft transition-colors hover:text-accent"
              aria-label="new thread"
            >
              + new
            </button>
          </div>

          <div
            data-lenis-prevent
            className="mt-3 min-h-0 flex-1 overflow-y-auto pb-4"
          >
            {threads.length === 0 ? (
              <p className="px-2 py-3 text-[13px] leading-relaxed text-soft">
                no threads yet. start one, jabby still remembers everything
                across all of them.
              </p>
            ) : (
              <>
                <ThreadGroup
                  label="today"
                  items={today}
                  activeId={activeThreadId}
                  onSelect={openThread}
                />
                <ThreadGroup
                  label="earlier"
                  items={earlier}
                  activeId={activeThreadId}
                  onSelect={openThread}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* spacer keeps identity pinned when threads are hidden (collapsed) */}
      {collapsed && <div className="flex-1" />}

      {/* identity + collapse */}
      <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-3">
        {!collapsed && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-soft transition-colors hover:text-ink"
          >
            <span className="text-ink">matt</span>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path
                d="M2.5 3.5l2.5 2.5 2.5-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`rounded-bro p-1.5 text-soft transition-colors hover:text-ink ${
            collapsed ? "mx-auto" : ""
          }`}
          aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path
              d={collapsed ? "M6 4l4 4-4 4" : "M10 4l-4 4 4 4"}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      </div>
    </nav>
  );
}

function ThreadGroup({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string;
  items: Thread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="px-2 pb-1.5 text-[11px] uppercase tracking-[0.18em] text-soft/70">
        {label}
      </div>
      <ul className="flex flex-col">
        {items.map((t) => {
          const isActive = t.id === activeId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className={`block w-full truncate rounded-bro px-2 py-1.5 text-left text-[13px] transition-colors ${
                  isActive
                    ? "bg-surface text-ink"
                    : "text-soft hover:text-ink"
                }`}
                title={t.title}
              >
                {t.title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
