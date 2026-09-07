# ARCHITECTURE

How the docket codebase is organised, so a human or an agent can orient in minutes — not hours.

> This is the **engineering orientation doc**. For the product idea & decisions, see the planning docs
> at `~/Hermes/apprank/apprank_idea/pm_wayfinder/`. For the future design ambition, see `DESIGN-VISION.md`.
> For the naming/brand policy, see below.

---

## 1. Repo layout (monorepo, npm workspaces)

```
app/                      <- this repo (git), lives at ~/Hermes/apprank/app
├── packages/core/        <- single source of truth for rules: validation, store (data layer), brand
│   ├── src/  validate.ts  kind-aware listing validation
│   │        listings.ts   Postgres data-access (publish/search/lifecycle/spotlight)
│   │        ratelimit.ts  in-memory sliding-window limiter
│   │        brand.ts      NAME/DOMAIN used by server + MCP (the agent-facing source)
│   └── test/             vitest
├── packages/mcp/         <- the agent-native MCP server (publish/search/claim verbs)
├── apps/web/             <- Next.js web app (the human window into the same DB)
│   ├── app/               page.tsx (server, fetches rows) · globals.css (theme)
│   │   _components/       Landing, Catalog, PublishModal  (client, "use client")
│   │   api/listings/      POST publish (rate-limited)
│   │   api/mcp/           POST/GET (stateless MCP over Streamable HTTP, /mcp rewrite)
│   │   llms.txt/          open agent index + install manifest
│   └── lib/               site.ts (web brand) · copy.ts (all copy) · taxonomy.ts (categories) · listing.ts (row map)
├── supabase/migrations/   0001, 0002 (plain Postgres, portable)
├── scripts/seed.mjs       seeds the dev board across all kinds
├── design-sketches/       throwaway HTML mockups (incl. the D variant that became the live design)
├── docs/                  THIS folder — orientation, architecture, design vision
├── README.md · SECURITY.md
```

## 2. The three-layer rule (why a redesign won't break things)

| Layer | Where | Redesign impact |
|---|---|---|
| **Data & logic** | `packages/core` (store/validation), server `page.tsx`, `api`, `mcp` | Never touched by a front-end redesign |
| **Presentation** | `apps/web/app/_components`, `globals.css`, `lib/copy.ts` | **Everything a redesign replaces** |
| **Config/source** | `lib/site.ts` + `core/brand.ts` (name/domain), `lib/taxonomy.ts` | Small, central edit points |

A design overhaul = swap components + tokens + copy. Data, DB, MCP, and the server page stay put.

## 3. Client vs server — the critical rule
- **`@docket/core` bundles `pg` (server-only `fs`).** Client components must **never import it**.
- Client components import **web libs only**: `site.ts`, `copy.ts`, `taxonomy.ts`, `listing.ts`.
- The server `page.tsx` imports `core` + fetches rows, serialises them to plain `ListingRow`
  (`lib/listing.ts`), and passes them **as props** to the client `Landing`. Client never talks to the DB.
- `taxonomy.ts` uses `import type { Kind }` — type-only, safe for client (erased at build).

**If you break this** you'll see `Module not found: Can't resolve 'fs'` at build. Fix: move the
value import out of a client component into a web lib or pass it as a prop.

## 4. Branding & copy policy (single-source, change in one place)
- **Name + domain appear in TWO files**, kept in sync manually (they serve different runtimes):
  - `packages/core/src/brand.ts` — used by MCP server + llms.txt (server/agent-facing).
  - `apps/web/lib/site.ts` — used by client components (web-facing).
- **All user-facing web copy** lives in `apps/web/lib/copy.ts`. Change text there.
- **Kind categories** live in `apps/web/lib/taxonomy.ts` (shared by publish modal + board browse filter).
  Ideas have no categories; Apps/MCPs/Skills each have their own alphabetical list (last = "Other").
- Do not hardcode brand/copy strings in components. Import from these files.
- Domain is configurable at runtime: web uses `NEXT_PUBLIC_MCP_URL` (falls back to `SITE.domain`),
  llms.txt uses `MCP_URL` env.

## 5. Data model (brief)
One `listings` table with a `kind` tag (`idea | app | mcp | skill`). Ideas need no url and carry a
**lifecycle** (`claim_state`: claimed → in_progress → built) via `claim_log`. Apps/MCPs/Skills carry a
`url` + `category`. `status` gates live vs pending/removed; `spotlighted` flags the hand-picked strip.
Full schema in `supabase/migrations/`. See planning `SPEC.md §6`.

## 6. Key flows
- **Publish (human):** `PublishModal` (client) → `POST /api/listings` → validates + rate-limits → `store.insertListing`.
- **Publish (agent):** MCP `publish` → same `store`. One DB.
- **Browse (human):** `page.tsx` fetches up to 200 live rows → client `Catalog` filters by kind/category/
  search and load-mores (8/page). Pure client-side over the already-fetched set (fine for launch scale).
- **Discover (agent):** MCP `search` / open `llms.txt`. **These never page** — capped top results + refine via query.
- **Pagination note:** launch uses client-side load-more over a 200-row fetch. When the catalog grows past
  ~a few hundred rows, switch to **server-side cursor-based loading** (keyset `WHERE created_at < last`
  `LIMIT 30`) — the UI (Catalog load-more) already supports it; only the fetch boundary changes.

## 7. Security posture (summary)
- MCP server auth: API-key, constant-time compare, fail-closed if key unset; binds loopback locally.
- Web publish: rate-limited per IP (5 / 10 min → 429). URL/handle validation hardening.
- No secrets in git; `.env.example` documents required vars. Full detail in `SECURITY.md`.

## 8. Run it (local)
```bash
# from ~/Hermes/apprank/app
nvm use 20
createdb apprank 2>/dev/null; createdb apprank_test 2>/dev/null
psql -d apprank -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql
npm install
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
# MCP server :3001
DATABASE_URL=postgres://localhost:5432/apprank MCP_API_KEY=dev-key npm run start --workspace @docket/mcp
# Web :3000
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
# Tests (core + mcp) against test DB
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

## 9. Where real listings are edited
There's no edit UI in the MVP — editing stays human-side via direct DB or a future admin. Claim/lifecycle
state changes come through the MCP verbs or directly in `store`.

## 10. Known gap — no idea-lifecycle UI on the web (DECIDED scope, not a bug)
**Status: OPEN decision / known gap.** The idea **lifecycle** (published → claimed → in_progress → built)
is fully implemented in the **data layer + MCP verbs** (`claim_idea`, `update_claim`, `my_ideas`,
`list_idea_activity`) — see `packages/core` + `packages/mcp`. The **web UI** shows the lifecycle *state*
on idea cards ("open to build" / "claimed by X" / "✓ built by X") but has **no buttons/flow to drive it** —
a human can't claim an idea or mark it built from the site; that's agent/MCP-side only.

**Why:** the lifecycle was designed agent-native (your agent claims/builds on your behalf). Whether a
human web UI for claim→build is wanted is **undecided** — revisit with the user before assuming it's a gap
to close. If added, it would be small: claim/build buttons on idea cards calling the same `store` methods
the MCP uses. (Decision log: `apprank_idea/pm_wayfinder/MAP.md` — add a D-row if resolved.)

