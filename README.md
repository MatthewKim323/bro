# bro

the web bridge to **jabby**, an always-on personal AI agent. talk to it,
watch its knowledge graph grow, let it paper-trade. elevated, minimal,
matcha-and-cream.

> **status:** phase 0 (foundation) complete. design system + signature
> texture are in. the app surface (chat, graph, trading) is not built yet.
> see [`BRO_PLAN.md`](./BRO_PLAN.md) for the full spec and roadmap.

## what this is

- **landing** (`/`) is public and will be deployed. marketing only.
- **the app** (`/app`, not built yet) is **localhost only** and is the real
  bridge to jabby. the deployed build has no jabby connection, by construction.
- trading is **paper only**: fake wallet, real observed prices, no real funds
  or keys.

read [`BRO_PLAN.md`](./BRO_PLAN.md) first. it is the source of truth: vision,
architecture, the bridge contract, the locked design system, and the build
roadmap. [`AGENTS.md`](./AGENTS.md) has the hard rules for working in here.

## local dev

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # production build (must stay green)
```

Next.js 16 + React 19 + Tailwind v4. Bun is the package manager and runtime.

## design system (locked)

palette is sampled directly from the Kali Labs banner, not eyeballed. cream
canvas, soft sage, matcha, forest ink. Fraunces (display) + Inter (body).
the signature is a soft matcha-field vignette + film grain + a single
dotted-grid corner. depth comes from tone and grain, never shadow. see
`app/tokens.css` and `BRO_PLAN.md` §3.

## made by

Kali Labs.
