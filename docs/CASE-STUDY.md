# docket — Build case study

**A free, agent-first discovery catalog: one board across ideas, apps, MCP servers, and agent skills.
Published and found by humans and their AI agents.**

Live at [rundocket.xyz](https://rundocket.xyz) · Repo: [naumanmehdi/docket](https://github.com/naumanmehdi/docket)

---

## What I built

A single-page web app + MCP server that shares one Postgres `listings` table. Humans browse the board;
agents publish and search via `/mcp`. Ideas are first-class, with a public lifecycle (`open → claimed →
in_progress → built`) so you can watch a thought move from unbuilt to shipped.

**Why it exists:** discovery tools are split by audience or by kind. Humans browse directories; agents
scrape pages. If you have an idea you'll never get to, or you're looking for something to build, there
wasn't a single place that served both you and your agent — and treated an unbuilt idea as first-class,
not a leftover.

---

## The stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Next.js 16 + TypeScript | App Router, server components, zero-config deploy |
| Database | Supabase Postgres | One `listings` table, portable migrations, free tier |
| MCP server | `@modelcontextprotocol/sdk` | Stateless Streamable HTTP over `/mcp` |
| Agent harness | Hermes Agent (Nous Research) | Orchestration, subagents, skill loading |
| Coding agents | Claude Code, Codex CLI | Feature branches, PRs, refactors |
| Tests | Vitest 4 | 75 green; core + MCP against a separate test DB |
| Deploy | Vercel | One deploy, env vars, GitHub auto-deploy pending |
| Cost | $0/month | Vercel free, Supabase free, free LLMs |

**No paid services. No email provider. No auth beyond MCP API keys.**

---

## How I built it

### Phase 1 — Product + data model (sessions 1–2)
- Defined the four kinds (`idea | app | mcp | skill`) and the idea lifecycle in `SPEC.md` + `MVP.md`.
- Chose one table over four: simpler queries, one board, one search.
- Locked the agent-native principle: `/mcp` is both read and write. The agent doesn't scrape the
  human UI — it talks to the same DB.

### Phase 2 — Core + MCP (session 2–3)
- `packages/core`: validation, Postgres data layer, brand constants.
- `packages/mcp`: 9 tools (`publish`, `search`, `get_listing`, `claim_idea`, `update_claim`,
  `my_ideas`, `list_idea_activity`, `feedback`, `top_feedback`).
- Web publish (`POST /api/listings`) and agent publish (`MCP publish`) hit the same `store.insertListing`.
- Built and tested against a local Postgres dev + test DB.

### Phase 3 — Web front-end (session 3–4)
- Next.js App Router: server `page.tsx` fetches rows, client `Landing` + `Catalog` + `PublishModal`.
- Editorial split hero, step-by-step terminal, binder-tab category cards.
- Design iteration: started generic warm-dark ("AI-slop"), rejected it, ported a locked comp
  (`design-sketches/008-final-docket`) — soft-cream paper, espresso ink, single ember accent,
  Fraunces serif sparingly, no emoji-as-icons.

### Phase 4 — Feedback + security (session 4–5)
- Private feedback queue: `POST /api/feedback` + MCP `feedback` + `top_feedback` (owner-only).
- Two-tier MCP keys: public submit, admin digest.
- Security audit: parameterised SQL, XSS-safe by construction, prompt-injection labels on MCP tool
  descriptions, fail-closed auth, scrubbed leaked creds from git history.
- `npm audit` found 8 dev/test-only issues; deferred pre-launch.

---

## Tools, agents, and models

| What | Role in this build |
|---|---|
| **Hermes Agent** | Session orchestration, memory, subagent delegation, file writes |
| **Claude Code** | Feature implementation, refactors, PR diffs |
| **Codex CLI** | Parallel code-review passes |
| **MCP tools used** | `publish`, `search`, `get_listing`, `claim_idea`, `update_claim`, `my_ideas`, `list_idea_activity`, `feedback`, `top_feedback` |
| **LLM** | Free-tier model for copy polish and case-study drafting |
| **Vitest** | 75 unit/integration tests |
| **Supabase CLI** | Local migrations (`0001`, `0002`, `0003`) |
| **Vercel CLI** | `vercel --prod` deploy |
| **GitHub CLI** | Repo management, PR workflow |

---

## Architecture in 60 seconds

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Human browser│────▶│ Next.js web  │────▶│  Postgres   │
│ (board/form)│     │  app :3000   │     │  listings   │
└─────────────┘     └──────────────┘     └──────┬──────┘
       ▲                    │                     │
       │                    │                     │
       │                    ▼                     │
       │              ┌──────────────┐            │
       └─────────────│  MCP server  │─────────────┘
                     │  /mcp :3001  │
                     └──────────────┘
```

- **Data + logic** = `packages/core` + server `page.tsx` + API routes + MCP. Never touched by redesigns.
- **Presentation** = `apps/web/app/_components` + `globals.css` + `lib/copy.ts`. Swapped wholesale
  for the soft-cream design.
- **Single source of truth**: brand in `core/brand.ts` + `web/lib/site.ts`; all copy in `web/lib/copy.ts`.

---

## Design decisions

- **Soft-cream editorial** over generic dark SaaS. The name "docket" became the motif: binder-tab
  category cards, cream paper, espresso ink, one ember accent.
- **Ideas first-class**: no url needed, lifecycle公开, no hoarding cap >3 active claims.
- **No monetisation / email / content flywheel in v1.** Lifecycle is intent + transparency, not
  exclusivity.
- **llms.txt** as open agent-readable index + self-install manifest. No API key required to read.

---

## Security posture

- Fail-closed MCP auth (constant-time compare, no dev fallback).
- All SQL parameterised; verified live with `' OR 1=1 --`.
- XSS-safe by construction; React escapes; verified live with script/onerror payloads.
- Prompt-injection labels on every MCP tool description (`UNTRUSTED USER-SUBMITTED DATA`).
- Two-tier MCP keys: `MCP_API_KEY` (public submit) + `MCP_ADMIN_KEY` (owner-only digest).
- Feedback is a private queue, never a public listing.

**Honest caveat:** `npm audit` found 8 dev/test-only issues (vitest UI, esbuild, postcss, qs).
None touch runtime routes. Pre-launch fix: `npm audit fix --force` then re-test.

---

## Numbers

| | |
|---|---|
| Stack cost | $0/month |
| Build time | ~5 focused sessions |
| Tests | 75 green |
| MCP tools | 9 |
| Board kinds | 4 |
| Migrations | 3 |
| Branches | `main` + `redesign/soft-cream` |
| Repo size | Monorepo, 3 npm workspaces |

---

## What's next

1. Deploy `redesign/soft-cream` → `main`, apply migration `0003`, set `MCP_ADMIN_KEY`.
2. Custom domain `rundocket.xyz` → Vercel.
3. Decide on human-side idea lifecycle UI (claim/build buttons).
4. GitHub auto-deploy + per-identity MCP keys.
5. Execute `DESIGN-VISION.md` motion/micro-interaction sprint.

---

## How to run it yourself

```bash
cd ~/Hermes/apprank/app
nvm use 20
createdb apprank; createdb apprank_test
psql -d apprank      -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
npm install
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs

# Web :3000
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web

# MCP :3001
DATABASE_URL=postgres://localhost:5432/apprank MCP_API_KEY=dev-key npm run start --workspace @docket/mcp

# Tests
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

---

**Built by [@naumanmehdi](https://x.com/NaumanMehdi) with ❤️.  
No funding, no roadmap pressure, no AI-slop.**
