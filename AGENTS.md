<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# bro

bro is the web bridge to **jabby** (matt's always-on AI agent at `~/Documents/jabby`).
Read **`docs/BRO_PLAN.md`** in this repo first. It is the source of truth: vision,
architecture, the bridge contract, design system, and the build roadmap.

## hard rules (do not break)

1. **No em dashes or en dashes. Ever.** Not in copy, code, comments, or commits.
   Use commas, periods, parens, colons, or "..." instead. They read as an LLM tell.
2. **Truthful copy only.** Never claim a capability bro/jabby does not have.
   Roadmap things are labeled as roadmap.
3. **The design system is LOCKED.** Palette is sampled from the Kali Labs banner
   (`app/tokens.css`). Fraunces + Inter. Do not introduce new colors, a second
   radius, drop shadows, or dark mode without a deliberate decision logged in
   `docs/BRO_PLAN.md` §15.
4. **The deployed build has no jabby connection, by construction.** jabby's repo
   is not modified by this project.
5. **No real money.** Trading is paper only: fake wallet, real observed prices,
   zero real keys or funds.

## architecture in one breath

Separate codebases. bro (Next.js, this repo) talks to jabby over **localhost
HTTP** and reads **gbrain** directly via its CLI. Browser only ever calls bro's
own `/api/*` route handlers. See `docs/BRO_PLAN.md` §9 for the verified contract.

## design language (see `docs/BRO_PLAN.md` §3)

Elevated, sleek, minimal, luxurious, calm. It should feel like it costs money.
Signature = matcha field gradient + film grain + a single dotted-grid corner.
Depth comes from tone and grain, never shadow. Motion is slow and meaningful
(`lib/motion.tsx`: `BRO_EASE` / `BRO_DUR` / `BRO_STAGGER`).

UX bar: **no manual.** It must come naturally. The 8 UX laws in `docs/BRO_PLAN.md` §4
are enforceable, every screen is reviewed against them.
