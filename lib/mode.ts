// the runtime gate. /app is the localhost bridge to jabby; it must never
// be reachable from the deployed public build. one switch, defaulting
// safe. see BRO_PLAN.md §5.
//
//   BRO_MODE=local   -> the app surface is on (local dev / your machine)
//   BRO_MODE=public  -> landing only, /app 404s (the deployed build)
//   unset            -> on in `next dev`, off everywhere else
//
// "off by construction": the public build does not render /app at all,
// it is not a promise in copy, it is a notFound() in the layout.

export type BroMode = "local" | "public";

export function broMode(): BroMode {
  const explicit = process.env.BRO_MODE?.trim().toLowerCase();
  if (explicit === "local") return "local";
  if (explicit === "public") return "public";
  // no explicit value: safe default. only `next dev` unlocks it.
  return process.env.NODE_ENV === "development" ? "local" : "public";
}

export function isAppEnabled(): boolean {
  return broMode() === "local";
}
