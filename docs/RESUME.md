# RESUME — docket handoff

Live at **https://rundocket.xyz**. Branch **main**, pushed to GitHub (`naumanmehdi/docket`).

## Stack
- Next.js + TS + Supabase Postgres + Vercel
- npm scope `@docket/*`
- Tests: core 61, mcp 35 (green)
- DB: `apprank` (local + prod; don't rename)

## Secrets
- `DATABASE_URL`, `MCP_API_KEY`, `MCP_ADMIN_KEY` (Vercel envs)
- Admin key doc: `docs/ADMIN.md`
- Never commit secrets

## What ships
- `/` — soft-cream editorial board, binder-tab motif
- `/mcp` — Streamable HTTP agent endpoint, 2-tier auth
- `/mcp-docs` — agent setup docs (Claude/Hermes/generic)
- `/register` — invite-code signup → per-identity MCP key
- `/admin` — owner back-office (codes/keys/revoke)
- `/llms.txt` — agent-readable index
- `POST /api/feedback` — private intake

## Local setup
```bash
cd ~/Hermes/apprank/app
nvm use 20
npm install
createdb apprank 2>/dev/null; createdb apprank_test 2>/dev/null
psql -d apprank -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql -f supabase/migrations/0004_invite_codes_and_keys.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql -f supabase/migrations/0004_invite_codes_and_keys.sql
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
```

## Tests
```bash
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

## Deploy
```bash
cd ~/Hermes/apprank/app && nvm use 20
vercel --prod
```

## Open decisions
1. Terminal spacing — still iterating
2. `rundocket.xyz` MX — no email set up yet

## File map
| File | What |
|---|---|
| `apps/web/app/page.tsx` | landing page |
| `apps/web/app/_components/Landing.tsx` | header, hero, nav, register panel |
| `apps/web/app/register/page.tsx` | invite-code signup |
| `apps/web/app/mcp-docs/page.tsx` | MCP setup docs |
| `apps/web/app/admin/page.tsx` | admin back-office |
| `apps/web/app/api/mcp/route.ts` | MCP endpoint |
| `apps/web/app/api/mcp-keys/register/route.ts` | register API |
| `apps/web/app/api/admin/invite-codes/route.ts` | admin codes |
| `apps/web/app/api/admin/mcp-keys/route.ts` | admin keys |
| `packages/mcp/src/server.ts` | 9 MCP tools |
| `packages/mcp/src/auth.ts` | key-lookup + scope check |
| `packages/core/src/access.ts` | store + validation |
| `apps/web/lib/copy.ts` | all user-facing copy |
| `apps/web/app/globals.css` | design tokens |
| `supabase/migrations/0004_invite_codes_and_keys.sql` | invite codes + keys schema |
| `docs/PER-IDENTITY-KEYS.md` | per-identity keys plan |
| `docs/ADMIN.md` | admin key location + access |
| `design-sketches/admin.html` | admin UI mockup |
| `design-sketches/mcp-setup.html` | MCP docs mockup |
| `design-sketches/register.html` | register mockup |

## Don't
- Re-explain the product
- Rename DB/folder `apprank`
- Touch another profile's files
- Commit secrets / `CASE-STUDY.md` / private docs
