# RESUME HERE — handoff for the next session (updated 2026-09-06)

Read this + `ARCHITECTURE.md` first, then `git status`. Don't re-derive anything — it's all below.

## Brand decided
**Name: `docket` · Domain: `rundocket.xyz`** (lowercase wordmark everywhere). Swap lives in
`packages/core/src/brand.ts` + `apps/web/lib/site.ts`.

## Where the project stands (end of today)

### Built and committed
- Monorepo: `packages/core` (shared data layer + zod validation + brand), `packages/mcp` (7-tool MCP server),
  `apps/web` (Next.js 15 + React 19 warm-dark board).
- 75 tests pass; production build passes under Node 20.
- Supabase migrations applied (`listings` + `claim_log` tables). Seed: 31 listings across 4 kinds.
- All user-facing copy rewritten to match the shipped 4-kind board.
- Old content-flywheel/outreach templates marked ARCHIVED (not part of v1).

### Step A complete — test deploy live
- **GitHub repo:** https://github.com/naumanmehdi/docket (pushed from `~/Hermes/apprank/app`)
- **Supabase:** project `mgzjmjjrcuiwdjvjonzn` (named "docket"), pooler connection set up
- **Vercel test deploy:** https://docket-9izw3lue6-naumandevs-projects.vercel.app
  - Board renders, `llms.txt` serves, DATABASE_URL env set (secret), 31 seeded rows visible
  - Deployment protection disabled for testing
  - GitHub auto-deploy NOT connected (Vercel OAuth identity lacks repo write access)
  - Custom domain `rundocket.xyz` NOT yet pointed (deferred to after test verify)

### Step B deferred — MCP `/mcp` route
- The MCP server currently runs as a standalone Node process (`node dist/index.js`, port 3001)
- To host it on Vercel, an `/mcp` API route needs to be added inside `apps/web` so the MCP
  rides the same Vercel deployment. This is the next build step when the user is ready.

## Accounts & secrets (for next session setup)
**GitHub:** `naumanmehdi` (note: accounts doc had `nauman388` — actual login is `naumanmehdi`)
- gh CLI authenticated, `workflow` scope granted, repo `naumanmehdi/docket` created and pushed

**Supabase:** project `mgzjmjjrcuiwdvjvonzn` (project name: "docket")
- Personal access token: `[REDACTED]` (keep private)
- Database password: `[REDACTED]`
- Connection string (pooler):
  ```
  postgresql://postgres.mgzjmjjrcuiwdvjvonzn:[REDACTED]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- CLI: `supabase login` via `SUPABASE_ACCESS_TOKEN`, `supabase link --project-ref mgzjmjjrcuiwdvjvonzn`
- Migrations pushed (`supabase db push`), 31 rows seeded

**Vercel:** user `nauman-dev`, project `naumandevs-projects/docket`
- CLI authenticated
- Project linked, deployed to temp `.vercel.app` domain
- `DATABASE_URL` set as Vercel Secret across all environments
- GitHub Git integration NOT connected (Vercel identity lacks repo write access; deploys via CLI)

## Accounts file (outside git repo)
Full account log kept at `~/Hermes/notes/app_accounts.md` — never pushed to GitHub.

## Open items / decisions (next session)
1. **Step B — MCP `/mcp` route:** build the `/mcp` API route inside `apps/web` so agents can connect
   to the deployed Vercel host (this is the real agent-native front door).
2. **Idea-lifecycle web UI** — OPEN. Lifecycle works agent/MCP-side only; web shows state but no
   claim/build buttons. Decide if a human web UI is wanted (would be small). `ARCHITECTURE.md §10`.
3. **Design-vision sprint** — the high-end playful/motion "mind-blown" redesign (separate future
   workstream). `DESIGN-VISION.md`. Launch on D first; redesign is a front-end-only swap.
4. **GitHub auto-deploy integration** — requires giving Vercel's GitHub app write access to the repo,
   or using a Vercel GitHub App installation on the `naumanmehdi` account.
5. **Custom domain** — point `rundocket.xyz` at the Vercel project after test deploy is verified.

## Files that matter (quick index)
- `docs/README.md` → orientation index
- `docs/ARCHITECTURE.md` → how the code is organised (read before touching code)
- `docs/DESIGN-VISION.md` → future design concept
- `packages/core/src/brand.ts` → agent/server-facing name (single source)
- `apps/web/lib/site.ts` → web-side name/domain (keep in sync with brand.ts)
- `apps/web/lib/copy.ts` → all user-facing copy
- `apps/web/app/globals.css` → all design tokens
- `apps/web/app/api/listings/route.ts` → web publish endpoint (POST only)
- `apps/web/app/page.tsx` → server-rendered board (reads from core Store directly)
- `apps/web/app/llms.txt/route.ts` → open agent-readable index + install manifest
- `packages/mcp/src/server.ts` → MCP tool definitions (7 tools)
- `packages/mcp/src/index.ts` → standalone MCP server entrypoint
- `supabase/migrations/*` → schema
- `scripts/seed.mjs` → seeds 31 dev rows
- `vercel.json` → Vercel deploy config (monorepo-aware)
- `.env.example` → env var reference
- Planning docs: `~/Hermes/apprank/apprank_idea/pm_wayfinder/{MVP,SPEC,MAP}.md`

## Do NOT
- Re-explain the product to the user — it's in the planning docs + this handoff.
- Touch another profile's files.
- Assume any open item is decided — ask the user.
