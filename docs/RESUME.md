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

## Recent changes (not yet on live)
- Header nav: `Explore | The board | MCP | Publish` (Publish is now ember pill)
- Terminal one-liner restored: `install docket from https://rundocket.xyz/mcp`
- JSON config added as collapsible fallback below one-liner
- Admin UI mockup: `design-sketches/admin.html`
- `/connect` page mockup: `design-sketches/mcp-setup.html`
- `/register` page mockup: `design-sketches/register.html`
- Docs slimmed: RESUME, ARCHITECTURE, SECURITY, WORKSTREAMS, CASE-STUDY
- CASE-STUDY.md kept local/private, ignored in git

## Deploy
```bash
cd ~/Hermes/apprank/app && nvm use 20
vercel --prod
```

## Open decisions (not bugs)
1. Idea-lifecycle web UI — agent-only for now; decide if human claim/build buttons wanted
2. GitHub auto-deploy — Vercel needs repo write access (GitHub App or creds)
3. **Per-identity MCP keys + invite codes** — plan in `docs/PER-IDENTITY-KEYS.md`. Current: shared `MCP_API_KEY` only; no self-serve. Web form is open to all; MCP key needed only for `/mcp`.
4. `rundocket.xyz` MX — no email set up yet
5. Terminal spacing — still being iterated on locally

## Next session: invite code system
**Read first:** `docs/PER-IDENTITY-KEYS.md` — full plan with DB schema, endpoints, admin UI, rate limiting, analytics.

**What to build:**
- Migration 0004: `invite_codes` + `mcp_keys` tables + `mcp_rate_limits` table
- Core store methods for key lookup + invite code validation
- Auth layer: DB key lookup + scope checks + master key fallback
- Server tool gating via scopes
- Registration endpoint: `POST /api/mcp-keys/register` (invite code + email → key)
- Admin endpoints: `GET/POST /api/admin/invite-codes`, `GET /api/admin/mcp-keys`, `POST /api/admin/mcp-keys/revoke`
- Optional admin page: `apps/web/app/admin/page.tsx` (simple HTML UI)
- Tests for all new endpoints + auth

**Delegation pattern:**
- Agent 1 (backend): migrations + core + auth + server + backend tests
- Agent 2 (web): registration + admin endpoints + frontend + web tests
- Parent: integration + deploy to preview + merge to main

**Design refs:**
- `design-sketches/admin.html` — admin UI mockup
- `design-sketches/mcp-setup.html` — `/connect` page mockup
- `design-sketches/register.html` — `/register` page mockup

**To start:**
```bash
cd ~/Hermes/apprank/app && nvm use 20
git checkout -b feature/per-identity-keys
```

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
| `docs/PER-IDENTITY-KEYS.md` | per-identity keys plan |
| `docs/ARCHITECTURE.md` | full orientation |
| `docs/WORKSTREAMS.md` | branding / content / case-study brief |
| `docs/CASE-STUDY.md` | product story (local only) |
| `design-sketches/admin.html` | admin UI mockup |
| `design-sketches/mcp-setup.html` | /connect page mockup |
| `design-sketches/register.html` | /register page mockup |

## Don't
- Re-explain the product (read the docs above if needed)
- Rename DB/folder `apprank`
- Touch another profile's files
