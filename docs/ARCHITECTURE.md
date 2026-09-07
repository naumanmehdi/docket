# Architecture — docket

Repo: **`~/Hermes/apprank/app`**, branch **main**, pushed. npm workspaces monorepo.

```
app/
├── packages/core/        <- rules: validation, store (data), brand
│   ├── src/ validate.ts listings.ts ratelimit.ts brand.ts
│   └── test/
├── packages/mcp/         <- agent-native MCP server (9 tools)
├── apps/web/             <- Next.js app (human window into the same DB)
│   ├── app/ api/{listings,feedback,mcp}/ llms.txt/
│   └── lib/ site.ts copy.ts taxonomy.ts listing.ts
├── supabase/migrations/  0001, 0002, 0003
├── scripts/ seed.mjs verify_feedback.mjs
└── docs/ RESUME.md ARCHITECTURE.md SECURITY.md CASE-STUDY.md WORKSTREAMS.md
```

## Three-layer rule
| Layer | Where | Redesign impact |
|---|---|---|
| Data & logic | `packages/core`, server routes, MCP | Never touched |
| Presentation | `apps/web/app/_components`, `globals.css`, `lib/copy.ts` | Everything a redesign replaces |
| Config | `lib/site.ts`, `core/brand.ts` | Small, central edit points |

## Client vs server (critical)
- `@docket/core` bundles `pg` (server-only `fs`). Client components must **never** import it.
- Client imports **web libs only**: `site.ts`, `copy.ts`, `taxonomy.ts`, `listing.ts`.
- `page.tsx` fetches rows → serialises to `ListingRow` → passes as props to client. Client never talks to DB.

## Brand & copy (change in one place)
- `packages/core/src/brand.ts` — name/domain used by MCP + llms.txt (agent-facing)
- `apps/web/lib/site.ts` — same for client components (web-facing)
- `apps/web/lib/copy.ts` — **all** user-facing copy
- `apps/web/lib/taxonomy.ts` — kind categories (ideas = none; apps/MCPs/skills alphabetical, last = "Other")

## Data model
One `listings` table, `kind` in `idea | app | mcp | skill`. Ideas carry lifecycle (`claim_state`: claimed → in_progress → built) via `claim_log`. Apps/MCPs/Skills carry `url` + `category`. `status` gates live vs pending/removed; `spotlighted` flags curated strip. Full schema in `supabase/migrations/`.

## Key flows
- **Publish (human):** `PublishModal` → `POST /api/listings` → validate + rate-limit → `store.insertListing`
- **Publish (agent):** MCP `publish` → same store, one DB
- **Browse (human):** `page.tsx` fetches up to 200 rows → client `Catalog` filters/load-mores (8/page)
- **Discover (agent):** MCP `search` / open `llms.txt` — capped top results + refine via query

## Security summary
Fail-closed MCP auth (constant-time compare, no dev fallback). Web writes rate-limited per IP. All SQL parameterized. Zero XSS sinks. Prompt-injection labels on MCP tool descriptions. CORS-blocked cross-origin. Full detail in `SECURITY.md`.

## Run it
```bash
cd ~/Hermes/apprank/app && nvm use 20
createdb apprank apprank_test 2>/dev/null
psql -d apprank -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
npm install
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
# MCP server :3001
DATABASE_URL=postgres://localhost:5432/apprank MCP_API_KEY=dev-key npm run start --workspace @docket/mcp
# Web :3000
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
# Tests
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

## Known gap (decided scope, not a bug)
Idea lifecycle (claim → build) is fully implemented in data layer + MCP verbs; web UI shows lifecycle state but has no human-side buttons. Undecided whether to add — revisit before assuming it's a gap.
