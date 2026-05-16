# bro

**the bridge to jabby.** a calm, luxurious web surface for an always-on personal AI agent: chat with it, watch its mind grow, let it trade.

> status: **building.** foundation + a real landing are shipped; the `/app`
> bridge (shell + knowledge graph) is in progress. this doc is the source of truth.
>
> built for a hackathon. targeted tracks: **Framer-tier design**, **Best Use of
> Solana**, **Best Use of Backboard**, **Best Use of MongoDB Atlas**. every one
> is a *real* integration powering a real, visible feature on the landing.
> nothing is faked or stubbed-to-look-used. an integration without a key
> degrades to an honest "not configured" state, it never fakes success. the
> UI/UX is still the product: it has to feel inevitable, not learned.

---

## table of contents

1. [the pitch](#1-the-pitch)
2. [the cast: bro, jabby, gbrain](#2-the-cast-bro-jabby-gbrain)
3. [design language](#3-design-language)
4. [UX laws (the "no manual" rules)](#4-ux-laws-the-no-manual-rules)
5. [product surface map](#5-product-surface-map)
6. [the landing page (deployed, marketing only)](#6-the-landing-page-deployed-marketing-only)
7. [the app shell](#7-the-app-shell)
8. [panel specs](#8-panel-specs)
9. [the bridge (architecture + contract)](#9-the-bridge-architecture--contract)
10. [trading subsystem (paper, fake wallet)](#10-trading-subsystem-paper-fake-wallet)
11. [tech stack](#11-tech-stack)
12. [repo structure](#12-repo-structure)
13. [build roadmap](#13-build-roadmap)
14. [non-goals](#14-non-goals)
15. [decisions log + open questions](#15-decisions-log--open-questions)
16. [glossary](#16-glossary)

---

## 1. the pitch

most "AI dashboards" are a chat box bolted onto a settings page. they feel like tools. you have to learn them.

bro is the opposite. it is the room where an always-on agent lives. you walk in, you talk to it, and around the conversation you can see it thinking, remembering, scheduling, and trading. nothing needs explaining because nothing is hidden behind a menu you have to discover.

the core insight that makes the design work:

> **threads organize your view. bro never forgets across them, because underneath it is one mind.**

every other product has to choose between "organized history" and "continuous memory." bro gets both for free because jabby is genuinely one continuous brain (gbrain-backed). the multi-thread sidebar is purely how *you* slice the conversation. jabby still remembers everything, everywhere. that reconciliation is the spine of the whole experience and it should be felt, not explained.

three things you can do here, each a panel, each calm:

- **talk to it** (chatgpt-style, multi-thread, streaming, with a collapsible "what bro did" trace)
- **watch its mind** (an interactive force-graph of its knowledge, plus a memory reader)
- **let it trade** (a paper-trading desk over discovered Solana memecoin movers, fake wallet, zero real funds)

luxurious, sleek, minimal. matcha and cream. film grain. a serif that whispers. it should look like a private members' club, not a SaaS trial.

---

## 2. the cast: bro, jabby, gbrain

three entities. keep them straight, the whole architecture depends on it.

| name | what it is | where it lives | who owns it |
|---|---|---|---|
| **jabby** | the agent. claude running headless as a daemon. has a personality, talks like a friend, can act. | `~/Documents/jabby` (separate repo, untouched by this project) | existing, runs via LaunchAgent |
| **gbrain** | jabby's memory. ~8000 pages of real history embedded as a knowledge graph. queryable by CLI and MCP. | local brain, CLI at `~/.bun/bin/gbrain` | existing |
| **bro** | this project. the web surface. a separate Next.js app that bridges to jabby over localhost and reads gbrain directly. | `~/Documents/bro` → `github.com/MatthewKim323/bro` | new, what we build |

**they are separate on purpose.** bro never imports jabby's code. bro talks to jabby the way anything talks to a service: HTTP over localhost. bro reads gbrain the way anything reads a database: through gbrain's own CLI. clean seams, independent failure, easy to demo.

```
                 ~/Documents/bro  (Next.js)
                 ┌───────────────────────────────┐
   you  ──────►  │  landing (public, deployed)   │
                 │  app     (localhost only)     │
                 │   ├─ chat                     │
                 │   ├─ knowledge graph          │
                 │   ├─ memory                   │
                 │   ├─ schedules & jobs         │
                 │   ├─ activity & logs          │
                 │   ├─ trading (paper)          │
                 │   └─ settings                 │
                 └──────┬──────────────┬─────────┘
                        │ HTTP         │ CLI
                        │ localhost    │ spawn
                        ▼              ▼
                ┌──────────────┐  ┌──────────────┐
                │ jabby daemon │  │   gbrain     │
                │ Bun web srv  │  │  (CLI/brain) │
                │ /api/chat …  │  │  graph/get…  │
                └──────────────┘  └──────────────┘
                        ▲              ▲
                        └──── jabby reads gbrain via MCP (its own path) ────┘
```

---

## 3. design language

this is a design competition. this section is the product. it is locked unless we deliberately revisit it.

### 3.1 north star

> elevated, sleek, minimal, luxurious, calm. it should feel like it costs money and respects your attention.

reference vibe: getfolk.app's restraint and density, but the palette and mood are bro's own, designed from scratch: a soft, film-grained noisy matcha gradient melting into cream, forest ink, a refined serif, tiny tracked-out labels, whisper-low-contrast body copy, and a lot of negative space.

it is **not** playful, neon, glassy, gradient-button, or "AI startup." no purple. no glow. no drop shadows doing the work that tone should do.

### 3.2 palette (bro's own system, locked, do not eyeball-edit)

| token | hex | role |
|---|---|---|
| `--bg` | `#F4F3EF` | cream canvas, the page |
| `--surface` | `#E4E8DC` | soft sage panel, alternating section, cards |
| `--matcha` | `#A8B89A` | mid matcha: gradient, soft fills |
| `--sage-deep` | `#7E9270` | deep sage: gradient edge, accents |
| `--accent` | `#5E7351` | forest: primary CTA, interactive, focus |
| `--ink` | `#23241F` | primary text, warm near-black |
| `--soft` | `#7C8A72` | secondary text, tracked labels |
| `--line` | `#E0E2D7` | hairlines, borders |
| `--footer-bg` | `#ECEBE4` | slightly deeper cream, footer |

dark mode is **out of scope for v1.** the light matcha world is the brand. if we ever do dark, it is a separate locked palette, not an inversion.

### 3.3 the signature texture (this is what wins)

three layers, composited, used with restraint. this is the single most important visual decision.

1. **matcha field** (`<MatchaField/>`): a soft diagonal gradient from `--sage-deep`/`--matcha` at the corners melting into `--bg` at the center. used on the hero, the CTA band, the app's empty states, and the trading desk header. never on a panel you read text in for long.
2. **film grain** (`<Grain/>`): a fixed SVG `feTurbulence` fractalNoise overlay, ~5 to 7% opacity, `mix-blend-mode: soft-light`, `pointer-events: none`, full viewport. it is always on, everywhere, including the app. it is the connective tissue between landing and app. without it the cream looks digital. with it the whole thing looks printed.
3. **dotted grid**: a faint CSS radial-dot pattern, `--soft` at very low alpha, used exactly once per screen as a corner micro-detail. it is seasoning, not wallpaper.

### 3.4 type

- **display:** Fraunces (Google, variable, soft optical serif). headlines, the `bro` wordmark, big numbers (graph counts, PnL). weight 400 to 500, tracking `-0.02em`, line-height `1.05` at display sizes.
- **body / UI:** Inter. paragraphs, controls, table data. weight 400, line-height `1.65`, ink at ~85% opacity for body so it never shouts.
- **labels:** Inter 500, `uppercase`, `letter-spacing: 0.18em`, 12px, color `--soft`. these tiny tracked labels are a brand signature. use them for section eyebrows, panel titles, metadata.

type scale (px): label 12 · body 16 to 18 · h3 22 · h2 34 to 44 · hero 60 to 76.

### 3.5 spacing, grid, depth

- 8px base unit. everything is a multiple.
- section vertical rhythm: 96 to 128px on the landing. panels breathe at 32 to 48px.
- container max-width: 1180px landing. app uses a fluid two-pane layout (sidebar + canvas).
- radius: 12px everywhere. one radius. consistency reads as expensive.
- **depth comes from tone and grain, not shadow.** default to zero box-shadow. if an element must lift (a popover, the command palette), it is a 1px `--line` border plus a barely-there `0 1px 0` hairline, never a blur cloud.

### 3.6 motion

calm. expensive things move slowly and only when meaningful.

```
EASE    = [0.22, 1, 0.36, 1]   // gentle, decelerating
DUR     = 0.7s                  // entrance
STAGGER = 0.06s                 // list/section reveal
HOVER   = opacity 0.85  OR  scale 1.02   // never both, never more
```

- Lenis smooth scroll on the landing, duration ~1.2. the app does not smooth-scroll its panels (you need precise scroll in a graph and a log).
- streaming chat text appears token by token with no layout jump.
- the force graph settles, it does not bounce.
- respect `prefers-reduced-motion`: reveals become instant fades, the graph skips its intro simulation.

### 3.7 component primitives (build once, reuse everywhere)

`<MatchaField/>` · `<Grain/>` · `<Button/>` (primary forest, ghost) · `<Label/>` (tracked uppercase) · `<Panel/>` (the app's content container) · `<Hairline/>` · `<EmptyState/>` (matcha field + one teaching sentence + one action) · `<StreamingText/>` · `<Trace/>` (the collapsible "what bro did" disclosure) · `<StatGroup/>` (Fraunces number + tracked label).

---

## 4. UX laws (the "no manual" rules)

matt's bar: "there shouldn't be a manual. it should come naturally." these are the enforceable rules that make that true. every screen is reviewed against them.

1. **one primary action per view.** there is always exactly one obvious next thing, rendered in forest `--accent`. everything else is quiet.
2. **progressive disclosure.** the surface shows the 20% you need. depth (the trace, raw logs, graph filters, trade details) is one click away, never in your face. the "what bro did" trace is collapsed by default.
3. **the empty state teaches.** no blank panels. every empty panel is a `<MatchaField/>` with one sentence telling you what this becomes and one button to make it happen. nobody reads docs, everybody reads the thing in front of them.
4. **keyboard-first, mouse-friendly.** `⌘K` command palette opens anything from anywhere (new thread, jump to graph, find a memory, place a paper trade). `⌘↵` sends a message. `esc` closes. the mouse never has to, but always can.
5. **state is always legible.** is bro connected? is it thinking? did the trade fill? there is a single calm status system (a small dot + word, top of the app shell) and it never lies. "thinking" looks different from "stuck."
6. **no dead ends.** every error is a sentence a human wrote, in `--ink`, with the one action that recovers it. never a stack trace, never a toast that vanishes before you read it.
7. **continuity is visible.** because jabby is one brain, switching threads must feel safe. a one-line, dismissible note the first time: "threads organize your view. bro remembers across all of them." shown once, then trusted.
8. **calm latency.** nothing blocks on a spinner. graph and logs stream in progressively. the chat streams. perceived speed is a design feature, not an optimization afterthought.

---

## 5. product surface map

```
bro
├── /                         landing (PUBLIC, deployed to Vercel, NO jabby)
│   └── nav · hero · transports · features · how it works
│       · the brain · quote · CTA · footer
│
└── /app                      the bridge (LOCALHOST ONLY, full jabby connection)
    ├── shell: left sidebar (nav + thread list) + main canvas + status bar + ⌘K
    ├── /app                  → chat        (default)
    ├── /app/graph            → knowledge graph
    ├── /app/memory           → memory browser/reader
    ├── /app/schedule         → schedules & jobs
    ├── /app/activity         → activity & logs
    ├── /app/trade            → trading desk (paper)
    └── /app/settings         → settings
```

the same codebase ships both. a single runtime gate (`BRO_MODE=public` vs `local`, defaulting safe) decides whether `/app` is reachable. the deployed build serves landing only and `/app` 404s. local dev unlocks everything. **the deployed site has zero jabby connection by construction**, not by promise.

---

## 6. the landing page (deployed, marketing only)

already designed in the prior session. it ships first because it is the lowest-risk way to lock the design language and it is the only public artifact. truthful copy only, jabby's lowercase voice, no em dashes.

sections, top to bottom:

1. **nav** (not sticky): `bro` wordmark (Fraunces) left · center links *what it does / how / the brain* · right pill *get bro* (forest). hairline appears on scroll.
2. **hero**: `<MatchaField/>` + `<Grain/>` + dotted-grid corner. label `ALWAYS ON. ALWAYS YOURS.` headline *your always-on AI agent.* sub *lives in discord, telegram, or the web. learns your world. helps you think, remember, and ship.* primary `get bro`, ghost *see how it works*. product visual is a tasteful CSS/SVG mock (a calm chat card behind a faint node graph), never a stock screenshot.
3. **transports**: *one brain. every channel.* + three drawn monochrome chips (Discord, Telegram, Web), no brand-color logos.
4. **features** (4 stacked, truthful to what jabby actually does): talks everywhere remembers everywhere · a memory that grows · runs on a schedule · keeps working when models don't.
5. **how it works**: 01 connect · 02 feed it · 03 just talk. big Fraunces numerals, no cards.
6. **the brain**: a larger animated SVG node-graph motif. small `coming soon` tag, honest, this is the teaser for the real graph panel.
7. **quote**: one restrained line. *it is not a chatbot. it is the one that already knows.* attributed `bro`.
8. **CTA**: full-width matcha-field band, *ready when you are.* + `get bro`.
9. **footer** (`--footer-bg`): wordmark, one-line tagline, minimal columns (product / roadmap / made by Kali Labs), © 2026.

---

## 7. the app shell

chatgpt-familiar so it needs zero learning, but quieter and warmer.

```
┌──────────────┬───────────────────────────────────────────────┐
│  bro         │  ● connected            chat ▾        ⌘K       │  status bar
│              ├───────────────────────────────────────────────┤
│  ◆ chat      │                                                │
│  ◇ graph     │                                                │
│  ◇ memory    │              main canvas                       │
│  ◇ schedule  │         (the active panel renders here)        │
│  ◇ activity  │                                                │
│  ◇ trade     │                                                │
│  ◇ settings  │                                                │
│              │                                                │
│  ── threads ─│                                                │
│  + new       │                                                │
│  · today     │                                                │
│    solana ?  │                                                │
│    fix the…  │                                                │
│  · earlier   │                                                │
│    …         │                                                │
│              │                                                │
│  matt ▾      │                                                │
└──────────────┴───────────────────────────────────────────────┘
```

- **left sidebar**: collapsible (icons-only when collapsed). top = panel nav. below a hairline = thread list (only relevant when chat is the active panel, otherwise it dims back). bottom = identity/connection.
- **status bar**: the single source of truth for "is this alive." dot + word: `connected` / `thinking` / `reconnecting` / `offline`. driven by `/api/health` + `/api/state` polling and the active SSE stream.
- **⌘K command palette**: the universal entry point. fuzzy over: new thread, switch panel, find a memory (gbrain query), open a graph node, place a paper trade, toggle settings. this is rule 4 made real.
- the shell, status, sidebar, and palette are built **once** and never re-thought per panel.

---

## 8. panel specs

each panel: what it is, the UX, where the data comes from, the states.

### 8.1 chat (default panel, `/app`)

the heart. chatgpt-style, multi-thread, streaming.

**the thread model (read this carefully, it is the whole trick).**
jabby's `/api/chat` is **stateless**: one message in, a stream out, no session id. jabby is one continuous gbrain-backed brain. therefore:

- **bro owns threads.** a thread is a bro-side, locally persisted transcript: title, created-at, ordered messages, and each message's trace. stored in bro's local store (see §9.4).
- every message, regardless of thread, posts to the same `/api/chat`. jabby answers with its full continuous context. it does not know what a "thread" is and does not need to.
- threads are **for you**: organization, recall, a clean view. they are not memory boundaries. memory is gbrain, and it is global.
- shown once, rule 7: *"threads organize your view. bro remembers across all of them."*

**UX**

- composer pinned bottom, Fraunces-free, generous. `⌘↵` sends. grows to ~6 lines then scrolls. one primary send affordance in forest.
- user message: quiet, right-aligned-ish, `--surface` bubble, no avatar noise.
- bro message: streams token by token via `<StreamingText/>`, ink on cream, no bubble (it is the voice of the room, it does not need a container). Fraunces only for any heading-like lines it emits.
- **the trace** (`<Trace/>`): under each bro message, a single collapsed line: `▸ what bro did · 3 steps`. expands to a calm vertical list of what happened (gbrain query, job created, paper trade placed, model route, compaction). this maps to the SSE `unblock` signal and any structured step events. collapsed by default (rule 2). this is the transparency matt asked for, done with restraint.
- new thread: `+ new` or `⌘K → new thread`. first user message auto-titles the thread (short, derived locally from the message, or asked from jabby cheaply later, decided in build).
- streaming states: idle → sending → `thinking` (status bar + a soft inline pulse) → streaming → done. `unblock` event flips a subtle "still working" affordance off. `error` renders rule 6: one human sentence + retry.

**data**: `POST /api/chat` (SSE, body `{ message }`, events `chunk` / `unblock` / `done` / `error`). thread persistence is bro-local.

### 8.2 knowledge graph (`/app/graph`)

the showpiece for the competition. an interactive force-graph explorer over gbrain's ~8000 pages. **reads gbrain directly, never through jabby's agent loop**, so it is fast and never contends with a chat in progress.

**UX**

- full-canvas force graph. nodes = pages, edges = typed links. node size by connectivity, color by page type within the matcha family (people, projects, concepts, transcripts as tonal variants of sage, never rainbow).
- it opens **calm, not exploded**: do not render 8000 nodes raw. open on a meaningful seed (recent salience or a chosen anchor) at depth 1 to 2, with a count like *8,142 pages · showing 86*. exploration expands outward on demand.
- click a node → a right-side reader slides in (the gbrain page rendered, its backlinks, "expand neighbors"). this fuses graph + memory so there is no context switch.
- search/filter bar (tracked-label styled): query focuses and re-centers the graph on matches. filter by type/tag/depth. this is the only place dense controls are allowed, and they stay one row.
- performance: level-of-detail (labels appear on zoom), edge bundling/cap at distance, web worker for the simulation, viewport culling. 8k nodes must never jank. settle, do not bounce.
- empty/loading: matcha field + *"this is everything bro knows. give it a moment to draw itself."* progressive node fade-in (rule 8).

**data** (bro backend spawns the gbrain CLI, JSON out):

- `gbrain list [--type T] [--tag T] -n N` → node universe / filtered set
- `gbrain graph <slug> --depth N` → neighborhood nodes/edges
- `gbrain backlinks <slug>` → incoming edges for the reader
- `gbrain get <slug>` → page body for the reader
- `gbrain query <q>` / `gbrain search <q>` → focus/search

### 8.3 memory (`/app/memory`)

the readable companion to the graph. a quiet library.

- left: searchable list of pages (`gbrain list`, `gbrain search`, `gbrain query`). grouped by type, tracked-label section heads.
- right: the reader. clean typographic rendering of a gbrain page (`gbrain get <slug>`), Fraunces headings, Inter body, backlinks at the foot as quiet chips. internal `[[links]]` are clickable and navigate within the reader, mirroring the graph.
- one search box, hybrid by default (`gbrain query`), with a subtle toggle to exact (`gbrain search`).
- this is mostly read-only in v1. writing/editing memory from the UI is a roadmap item, not v1 (jabby writes memory; bro shows it).

### 8.4 schedules & jobs (`/app/schedule`)

what bro does on its own, made visible and calm.

- **jobs**: list from `GET /api/jobs` (name, schedule, prompt preview). create via `POST /api/jobs/quick` (a single warm form: when + what, no cron syntax exposed, we translate). delete via `DELETE /api/jobs/{name}` behind a quiet confirm.
- **heartbeat / quiet hours**: `GET/POST /api/settings/heartbeat` (enabled, interval, prompt, exclude windows). rendered as a human sentence you edit inline ("check in every 4 hours, except 11pm to 8am"), never a raw form of fields.
- empty state teaches: *"bro can check in on a schedule. nothing runs yet. add the first one."*

**data**: `GET /api/jobs`, `POST /api/jobs/quick`, `DELETE /api/jobs/{name}`, `GET/POST /api/settings/heartbeat`.

### 8.5 activity & logs (`/app/activity`)

the pulse. proof bro is alive without needing the chat.

- top: a few `<StatGroup/>` tiles from `GET /api/state` (uptime, last turn, model, jobs count, connection). big Fraunces numbers, tracked labels.
- below: a live, reverse-chron log stream from `GET /api/logs?tail=N` (N clamps 20 to 2000 server-side; we default ~200, "load more" walks back). lines are tokenized and colored sparingly within the palette (errors in a muted clay that still lives in the warm world, not red).
- this panel is where rule 5 (legible state) and rule 8 (calm latency) get proven. it should feel like watching a heartbeat, not tailing a file.

**data**: `GET /api/state`, `GET /api/logs?tail=N`, `GET /api/health` (the dot).

### 8.6 trading desk (`/app/trade`)

paper trading over discovered Solana memecoin movers. **fake burner wallet, simulated fills, zero real funds, zero real keys.** see §10 for the engine. this section is the UX.

**the desk layout**

```
┌───────────────────────────────────────────────────────────┐
│  matcha-field header:  paper wallet  ◇ 100.00 SOL (sim)     │
│  total PnL  +12.4%        open positions 3       today 8     │
├──────────────────────┬────────────────────────────────────┤
│  movers (discovered)  │  position / ticket                  │
│  ─ trending now ─     │  TOKEN  ·  price · 24h · liquidity   │
│  $WIF   +38% ▲        │  ────────── sparkline ──────────     │
│  $POPCAT +21% ▲       │  amount [   ] SOL   est ___ TOKEN    │
│  $XYZ   -9%  ▼        │  [ buy (paper) ]  [ sell (paper) ]   │
│  …                    │  guardrail: max 10 SOL / trade (sim) │
├──────────────────────┴────────────────────────────────────┤
│  positions  ·  TOKEN  qty  avg  now  PnL    [close]          │
│  history    ·  filled trades, newest first                  │
└─────────────────────────────────────────────────────────────┘
```

**UX**

- **movers** is the discovery feed: recent trending Solana memecoins scraped from public sources (§10.2), refreshed on a calm cadence, never a flashing ticker. up/down in sage/clay, not green/red.
- **two ways to trade, both first-class:**
  1. *you*: click a mover, set size, `buy (paper)` / `sell (paper)`. confirm is a quiet inline step, not a modal pileup.
  2. *jabby*: ask in chat ("ape 5 sol into the top mover"). jabby calls bro's local trading tool (§10.4), the fill simulates, and it shows up here and in the chat trace identically. one engine, two front doors.
- **guardrails are product, not fine print** (rule 1, rule 6): a visible per-trade cap and daily cap, enforced in engine code (not the prompt), shown as a calm line on the ticket. since the wallet is fake these are about *realistic behavior and good demo*, not safety, but they make the desk feel real.
- positions and history are quiet tables, Inter tabular numerals, Fraunces only for the big PnL figure in the header.
- empty state: matcha field + *"no positions yet. bro is watching the movers. pick one, or ask bro to."*

**data**: bro-owned trading service + local ledger (§10). no jabby HTTP endpoint involved for fills; jabby participates only by calling bro's local tool.

### 8.7 settings (`/app/settings`)

quiet, one column, human sentences over forms.

- **connection**: jabby host/port, live status, `GET /api/technical-info` (version, model, paths) rendered as a calm card. a "test connection" that actually pings `/api/health`.
- **heartbeat / quiet hours**: same control as in schedule (single source, rendered in both places).
- **appearance**: v1 is the locked matcha light theme only. the toggle exists but says, honestly, *"dark mode is on the roadmap."* (no fake switch, rule 6.)
- **about**: what bro is, what is local-only, link to this doc / repo.

---

## 9. the bridge (architecture + contract)

### 9.1 shape

bro is a Next.js app. its **server side** (route handlers) is the only thing that talks to jabby and gbrain. the browser only ever talks to bro's own API. that keeps the contract in one place, keeps gbrain CLI spawning off the client, and means the deployed public build (which has no server routes wired to a daemon) is incapable of reaching jabby even if someone tried.

```
browser ──► bro /api/* (Next route handlers) ──► jabby Bun srv (HTTP, localhost)
                                              └─► gbrain (CLI spawn)
                                              └─► trading engine (bro-local)
```

### 9.2 jabby contract (verified against `~/Documents/jabby/src/ui/server.ts`)

| bro feature | jabby endpoint | method | shape |
|---|---|---|---|
| chat stream | `/api/chat` | POST | body `{ message }` → SSE: `{type:"chunk",text}` · `{type:"unblock"}` · `{type:"done"}` · `{type:"error",message}` |
| connection dot | `/api/health` | GET | `{ ok, now }` |
| activity stats | `/api/state` | GET | daemon snapshot (uptime, model, jobs, etc.) |
| logs stream | `/api/logs?tail=N` | GET | tail clamps 20..2000, default ~200 |
| jobs list | `/api/jobs` | GET | `{ jobs: [{ name, schedule, promptPreview }] }` |
| create job | `/api/jobs/quick` | POST | `{ time, prompt }` |
| delete job | `/api/jobs/{name}` | DELETE | url-encoded name |
| heartbeat read/write | `/api/settings/heartbeat` | GET / POST | `{ enabled, interval, prompt, excludeWindows[] }` |
| about/connection | `/api/technical-info` | GET | version, model, paths |
| settings | `/api/settings` | GET | sanitized settings |

jabby's repo is **not modified** by this project (one possible exception in §15). bro adapts to jabby's surface, not the other way around.

### 9.3 gbrain contract (verified against `gbrain 0.32.5` CLI)

bro's server spawns the `gbrain` binary and parses output. decoupled from jabby entirely.

`gbrain list` · `get <slug>` · `search <q>` · `query <q>` · `graph <slug> --depth N` · `graph-query <slug> --type T` · `backlinks <slug>`.

### 9.4 bro-owned state (local persistence)

things jabby/gbrain do not store, that bro must:

- **threads**: id, title, createdAt, updatedAt, messages[] (role, text, trace[], ts).
- **trading**: fake wallet ledger, positions, fills, watchlist, discovery cache (§10).
- **prefs**: collapsed sidebar, last panel, "continuity note seen" flag.

storage: a local store decided at build (SQLite via a tiny layer, or a JSON/IndexedDB hybrid for the browser-facing bits). it lives only on the local machine. it is never part of the deployed build.

### 9.5 connection + failure (rule 5, rule 6)

- a small poller hits `/api/health` and `/api/state`; the status bar reflects truth.
- jabby offline: panels that need it show a warm, specific empty state with a "retry" that re-pings, never a crash. the graph and memory panels **still work** (they only need gbrain), which is a deliberate resilience win to show in the demo.
- SSE drop mid-stream: detect, mark the message incomplete with a quiet "bro got cut off, ask again" affordance, keep the partial text.

### 9.6 safety note (kept short, on purpose)

local-only app, fake wallet, no real Solana keys, no real funds, deployed build has no jabby link by construction. the earlier "public agent + funded wallet" risk does not apply to this design. guardrails in the trading engine exist for realism and demo quality, not because money is at stake. that is the whole security section. moving on.

---

## 10. trading subsystem (paper, fake wallet)

self-contained bro service. simulated end to end.

### 10.1 fake wallet model

- a simulated wallet seeded with a configurable balance (default `100.00 SOL (sim)`). it is a number in bro's local ledger. there is no keypair, no RPC, no signature, no real network.
- every fill mutates the ledger only. PnL, positions, and history are pure functions of the ledger + observed prices.
- the word `(sim)` or `paper` is always visible near any balance or trade button. you can never mistake it for real (rule 5).

### 10.2 discovery (the "find recent movers" matt asked for)

bro's server periodically scrapes public, no-auth Solana memecoin market data for trending tokens and recent movers, normalizes it, and caches it.

- sources (public endpoints, read-only, picked at build for reliability): Dexscreener, GeckoTerminal, Birdeye-style public trending. we pick the most stable one or two and degrade gracefully if one is down.
- cadence: calm (e.g. every 60 to 120s while the desk is open), cached, never a flashing live feed. design rule 6: calm latency over real-time noise.
- normalized mover: `{ symbol, name, address, priceUsd, change24h, liquidity, volume24h, source, fetchedAt }`.
- this is the *only* trading data that is real. prices used for fills are these observed prices. the wallet and fills are simulated on top of real prices, which is exactly what makes a paper desk feel honest.

### 10.3 paper-fill engine

- a `buy`/`sell` takes (token, sizeSol). fill price = latest observed price for that token from the discovery cache, with an optional small simulated slippage so it is not unrealistically perfect.
- guardrails enforced **in engine code**: per-trade max (default 10 SOL sim), daily cumulative cap, token must exist in the discovery set (no filling a ticker we have no price for). violations return a human sentence the UI shows (rule 6).
- deterministic and inspectable: every fill writes a ledger entry that the trace and history render identically.

### 10.4 jabby's hook into trading

jabby trades by calling a **bro-local tool**, not by driving a UI and not by touching money:

- bro exposes a localhost-only tool surface (small HTTP, or a tiny MCP server bro ships) with: `list_movers`, `quote(token,size)`, `paper_buy(token,size)`, `paper_sell(token,size)`, `positions`.
- jabby's runner can call localhost; we register this so jabby can act when you ask it to in chat. the engine and guardrails are identical whether the caller is you or jabby. one engine, two front doors (§8.6).
- exact wiring (HTTP vs a bro MCP entry in jabby's `.mcp.json`) is a build decision in §13; either way the trading logic lives in bro, jabby only calls it.

---

## 11. tech stack

- **bro app**: Next.js 16.2.6 (App Router, TypeScript, Tailwind v4). Next 16 has breaking changes vs model training data: read `node_modules/next/dist/docs/` before writing Next-specific code, every session. an `AGENTS.md` in the repo enforces this.
- **motion**: `motion` ^12 (the retuned calm primitives), `lenis` ^1.3 (landing scroll only).
- **graph**: a force-graph lib chosen for 8k-node performance (candidates: `react-force-graph` / `sigma.js` / `cosmograph`). decided in the graph phase with a perf spike, not guessed here. it must do web-worker simulation + level-of-detail or it is disqualified.
- **fonts**: `next/font/google` Fraunces (`--font-display`) + Inter (`--font-sans`).
- **local store**: lightweight (SQLite via a small server-side layer, or JSON + IndexedDB split). decided at the persistence phase.
- **jabby / gbrain**: unchanged. consumed as services. jabby = Bun daemon, gbrain = CLI 0.32.5.
- **real sponsor integrations (landing, hella minimal, all genuine)**:
  - **Solana**: `lib/solana.ts` + `GET /api/solana/pulse`. one real `getEpochInfo`
    JSON-RPC call to mainnet, surfaced as a live pulse strip. no key, no wallet,
    no signing (read-only). verified live (`slot`/`epoch` tick).
  - **Backboard**: `lib/backboard.ts` + `POST /api/bro/ask`. real call to
    `app.backboard.io/api/threads/messages` (`X-API-Key`), `thread_id` kept for
    genuine persistent memory across the "talk to bro" demo.
  - **MongoDB Atlas**: `lib/mongo.ts` + `/api/waitlist`. real write + count
    on one collection (the `mongodb` driver, HMR-cached client).
  - all three are env-driven (`.env.example`), server-side only (keys never
    reach the browser), and degrade to honest "not configured" without creds.
- **deploy**: Vercel, landing only. `BRO_MODE` gates `/app` off in the public build.

no state library cargo-cult: server data via route handlers + a thin fetch layer, local UI state with React. add a store only if a panel proves it needs one.

---

## 12. repo structure

```
~/Documents/bro
├── AGENTS.md                  # Next 16: read node_modules/next/dist/docs first
├── CLAUDE.md                  # @AGENTS.md
├── BRO_PLAN.md                # this doc
├── README.md                  # what bro is, run locally, deployed = marketing only
├── app/
│   ├── layout.tsx             # fonts, metadata, Lenis, Grain (global)
│   ├── globals.css            # tailwind + tokens + light theme + Lenis
│   ├── tokens.css             # the locked palette as @theme
│   ├── page.tsx               # landing (composes sections)
│   ├── (marketing)/components/  Nav Hero Transports Features HowItWorks TheBrain Quote CTA Footer
│   ├── components/            # MatchaField Grain Button Label Panel Trace EmptyState StreamingText StatGroup
│   ├── app/                   # the bridge (localhost-gated)
│   │   ├── layout.tsx         # shell: sidebar + status bar + ⌘K
│   │   ├── page.tsx           # chat
│   │   ├── graph/ memory/ schedule/ activity/ trade/ settings/
│   └── api/                   # route handlers: chat(SSE proxy) state logs jobs settings gbrain trade health
├── lib/
│   ├── jabby.ts               # typed client for the §9.2 contract
│   ├── gbrain.ts              # CLI spawn + parse (§9.3)
│   ├── trading/               # discovery · paper-engine · ledger · guardrails
│   ├── store/                 # bro-local persistence (§9.4)
│   └── motion.ts              # BRO_EASE / BRO_DUR / BRO_STAGGER + Reveal/Stagger
└── public/                    # favicon (bro mark), og image
```

---

## 13. build roadmap

boil the ocean, but in an order where every phase ends in something you can look at. no time pressure, quality over speed.

> progress: **phase 0 done** (foundation + locked signature). **landing
> done** and reworked for the hackathon: real Solana / Backboard
> / MongoDB Atlas integrations woven into real sections (this replaced the
> "9 marketing sections" plan below with: nav, hero, Solana pulse, talk-to-bro,
> features, waitlist, footer). **phase 2 (app shell + knowledge graph) in
> progress.** the phases below are the original arc; the landing's scope shifted
> to serve the four tracks honestly.

**phase 0 — foundation**
- scaffold Next 16 in `~/Documents/bro`, add motion + lenis, read `node_modules/next/dist/docs/`
- `AGENTS.md`, `CLAUDE.md`, `tokens.css` (locked palette), fonts, globals, motion primitives, Lenis
- build + verify the signature: `<MatchaField/>` + `<Grain/>` + dotted grid actually read as bro's intended system
- git init, remote `github.com/MatthewKim323/bro`, first commit (confirm before push)

**phase 1 — landing (ships publicly)**
- all 9 sections (§6), screenshot-verified at 1440 / 768 / 390
- favicon, OG, README, `BRO_MODE` gate so `/app` is off in public build
- deploy to Vercel (confirm before prod). this locks the design language for the whole app.

**phase 2 — app shell**
- sidebar (collapsible) + status bar + ⌘K palette + routing for all 7 panels
- the connection poller + status system (rule 5), all empty states stubbed (rule 3)

**phase 3 — chat (the heart)**
- `lib/jabby.ts`, SSE proxy route, `<StreamingText/>`
- multi-thread model + local persistence (§9.4) + auto-title + continuity note (rule 7)
- `<Trace/>` collapsible "what bro did" wired to `unblock` + step events

**phase 4 — knowledge graph + memory (the showpiece)**
- `lib/gbrain.ts` CLI layer
- force-graph perf spike → pick the lib → calm-open, LOD, search/filter, click-to-reader
- memory browser/reader sharing the reader component

**phase 5 — schedules · activity · settings**
- jobs CRUD + heartbeat as human sentences, activity stats + log stream, settings

**phase 6 — trading desk (paper)**
- discovery scraper + cache, paper-fill engine + guardrails, fake ledger
- desk UI (movers / ticket / positions / history), then jabby's local trading tool (§10.4) so chat-driven trades land identically

**phase 7 — polish pass (the competition pass)**
- every screen audited against the 8 UX laws, motion calm everywhere, grain consistent landing↔app
- `bun run build` clean, no console errors, `grep -rnP "[—–]"` returns nothing
- responsive + reduced-motion + offline-jabby resilience demo path

each phase: build → screenshot-verify desktop + mobile → commit atomically.

---

## 14. non-goals

- the **deployed** site has no jabby connection, ever. landing is marketing only, by construction (`BRO_MODE`), not by promise.
- **no real money.** trading stays paper: no real Solana keypair, signatures, or funds. the real Solana integration is a **read-only** mainnet RPC call (a live stat), which touches no money and is not the trading engine. if real trading ever happens it is a new project with its own threat model, not a tweak.
- **no faked sponsor usage.** the hackathon tracks are won with real integrations or not entered. faking "we used X" was explicitly considered and rejected (see §15). an unconfigured integration says so honestly.
- jabby's repo is not modified (one possible read-only MCP-registration exception, §15, with consent).
- no mobile-native app. responsive web is the target.
- no dark mode in v1 (honest roadmap item, not a fake toggle).
- no multi-user / accounts / auth product. single user, local, matt.
- editing gbrain memory from the UI is roadmap, not v1 (bro shows memory, jabby writes it).

---

## 15. decisions log + open questions

**decided (this session, matt):**
- jabby and the webapp are **separate** codebases. bridge is localhost HTTP. ✓
- chat is **multi-thread** chatgpt-style, bro-owned threads over jabby's one brain. ✓
- collapsible **"what bro did" trace**. ✓
- **fake burner wallet, paper trading**, zero real funds. ✓
- trading **discovers** movers by scraping public memecoin trend data. ✓
- sidebar: chat / graph / memory / schedule / activity / trade / settings. ✓
- knowledge graph = **interactive force-graph explorer**. ✓
- design comp entry: UX must "come naturally," no manual. elevated, sleek, minimal, luxurious. ✓
- palette locked, bro's own system. no time constraints, quality over speed. ✓
- **hackathon**: targeting Framer-tier design + Best Use of Solana / Backboard / MongoDB Atlas. ✓
- **faking sponsor integrations was proposed, then rejected.** decoy imports / fake routing to look like we used Mongo + Backboard would be cheating judged prize tracks (MLH DQs misrepresentation, it follows the name across events, and it burns teams who built it for real). chose **real but hella minimal** integrations instead: each is genuine and powers one visible feature. ✓
- landing scope shifted from "9 marketing sections" to a focused real landing where each sponsor powers a section (Solana pulse, talk-to-bro, waitlist). ✓
- **git attribution**: commits/pushes are matt's, attributed to MatthewKim323. no AI co-author trailer. ✓
- `BRO_PLAN.md` moved to `docs/BRO_PLAN.md` (parallel work); README + AGENTS.md repointed. ✓

**open (resolve at the phase, not now):**
1. force-graph library: decided by a perf spike in phase 4 (must do worker + LOD).
2. local store: SQLite layer vs JSON/IndexedDB split, decided in phase 3.
3. jabby's trading hook: bro-local HTTP tool vs a bro MCP entry in jabby's `.mcp.json` (the only place jabby's repo might get a one-line, consented change), decided in phase 6.
4. thread auto-title: cheap local heuristic vs one cheap jabby call, decided in phase 3.
5. discovery source(s): which of Dexscreener / GeckoTerminal / Birdeye-public is most stable, decided in phase 6.

---

## 16. glossary

- **bro** — this web app. the bridge surface. what we build.
- **jabby** — the existing always-on AI agent (claude daemon) bro talks to. separate repo, untouched.
- **gbrain** — jabby's memory: ~8000 embedded pages as a knowledge graph. bro reads it directly via CLI.
- **the bridge** — the localhost HTTP + CLI seam between bro and jabby/gbrain.
- **thread** — a bro-side conversation view. organizational only. jabby's memory is global, not per-thread.
- **the trace** — the collapsible "what bro did" disclosure under a bro message.
- **matcha field** — the signature soft gradient backdrop.
- **paper / sim** — simulated trading. fake wallet, real observed prices, no real funds.
- **the movers** — discovered trending Solana memecoins, the only real data in the trading desk.

---

*made by Kali Labs · this doc is the source of truth · keep it honest, keep it calm.*
