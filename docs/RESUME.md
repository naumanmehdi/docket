# RESUME — docket handoff

Live at **https://rundocket.xyz**. Branch **main**, pushed to GitHub (`naumanmehdi/docket`).

## One-liners
- **Brand:** docket / rundocket.xyz / npm scope `@docket/*`
- **Stack:** Next.js + TS + Supabase Postgres + Vercel (free tier, $0/month)
- **Tests:** 75 green. **Audit:** 3 high (postcss build-time, sharp unused — neither at runtime)
- **Next pin:** 16.2.12 (hoisted to repo root so Vercel detects it). 16.3.4 cannot deploy.
- **DB:** `apprank` (local + prod; don't rename — live infra)

## Secrets
Set as Vercel envs: `DATABASE_URL`, `MCP_API_KEY`, `MCP_ADMIN_KEY`.
Source of truth: **`~/Hermes/notes/app_accounts.md`**. Never commit secrets.

## What ships
- `/` board — ideas/apps/MCPs/skills, 4 kinds, binder-tab soft-cream design
- `/mcp` — stateless agent endpoint, 2-tier auth (public submit / admin digest)
- `/llms.txt` — agent-readable index + install manifest
- `POST /api/feedback` — private intake, never public
- `/api/mcp` — Streamable HTTP, fresh transport per request

## Deploy
```bash
cd ~/Hermes/apprank/app && nvm use 20
vercel --prod
```

## Open decisions (not bugs)
1. Idea-lifecycle web UI — agent-only for now; decide if human claim/build buttons wanted
2. GitHub auto-deploy — Vercel needs repo write access (GitHub App or creds)
3. Per-identity MCP keys — shared key OK for pilot; per-user keys for public launch
4. `rundocket.xyz` MX — no email set up yet

## File map
| File | What |
|---|---|
| `apps/web/app/api/mcp/route.ts` | MCP endpoint |
| `apps/web/app/api/feedback/route.ts` | feedback intake |
| `packages/mcp/src/server.ts` | 9 MCP tools |
| `packages/core/src/listings.ts` | store + validation |
| `apps/web/lib/copy.ts` | all user-facing copy |
| `apps/web/app/globals.css` | design tokens |
| `supabase/migrations/0003_feedback.sql` | feedback schema |
| `docs/ARCHITECTURE.md` | full orientation |
| `docs/WORKSTREAMS.md` | branding / content / case-study brief |
| `docs/CASE-STUDY.md` | product story |

## Don't
- Re-explain the product (read the docs above if needed)
- Rename DB/folder `apprank`
- Touch another profile's files