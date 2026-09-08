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
- `/admin` — owner back-office for invite codes + issued keys (gated by master key)
- `/register` — self-serve invite-code redemption → MCP key

## Recent changes (not yet on live)
- Header nav: `Explore | The board | MCP | Publish` (Publish is now ember pill)
- Terminal one-liner restored: `install docket from https://rundocket.xyz/mcp`
- JSON config added as collapsible fallback below one-liner
- Per-identity MCP keys + invite codes backend complete (committed `729d973` on `feature/per-identity-keys`)
- Admin UI: `apps/web/app/admin/page.tsx` — committed in `729d973`
- Mockups: `design-sketches/admin.html`, `mcp-setup.html`, `register.html`

## Deploy
```bash
cd ~/Hermes/apprank/app && nvm use 20
vercel --prod
```

## Open decisions (not bugs)
1. Idea-lifecycle web UI — agent-only for now; decide if human claim/build buttons wanted
2. GitHub auto-deploy — Vercel needs repo write access (GitHub App or creds)
3. **Register contract** — backend expects `{ code, owner }`, register sketch expects `{ invite_code, owner }`. Pick one and reconcile. See `docs/PER-IDENTITY-KEYS.md`.
4. `/connect` nav link — currently dangling; decide if it should point to `/register` or a new MCP setup docs page
5. Terminal spacing — still being iterated on locally
6. `rundocket.xyz` MX — no email set up yet

## Per-identity keys: what's built
See `docs/PER-IDENTITY-KEYS.md` for full plan + backend details.

**Backend (committed `729d973` on `feature/per-identity-keys`):**
- Migration 0004: `invite_codes`, `mcp_keys`, `mcp_rate_limits`
- Core store: `packages/core/src/access.ts`
- Auth: `packages/mcp/src/auth.ts` — `resolveAuth` with scopes + master key fallback
- Server: `packages/mcp/src/server.ts` — tool gating via scopes
- Admin endpoints: 4 routes (list/create/revoke codes, list/revoke keys)
- Tests: core 61, mcp 35 (all green)

**Front-end:**
- Admin page: `apps/web/app/admin/page.tsx` — committed
- Register page + API route: untracked, needs contract resolution + commit
- Landing.tsx + copy.ts + globals.css: uncommitted front-end updates from design work

## File map
| File | What |
|---|---|
| `apps/web/app/api/mcp/route.ts` | MCP endpoint |
| `apps/web/app/api/feedback/route.ts` | feedback intake |
| `apps/web/app/admin/page.tsx` | admin back-office |
| `apps/web/app/register/page.tsx` | invite-code signup (untracked) |
| `apps/web/app/api/mcp-keys/register/route.ts` | register API (untracked) |
| `packages/mcp/src/server.ts` | 9 MCP tools |
| `packages/mcp/src/auth.ts` | key-lookup + scope check |
| `packages/core/src/access.ts` | store + validation |
| `apps/web/lib/copy.ts` | all user-facing copy |
| `apps/web/app/globals.css` | design tokens |
| `supabase/migrations/0003_feedback.sql` | feedback schema |
| `supabase/migrations/0004_invite_codes_and_keys.sql` | invite codes + keys |
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
