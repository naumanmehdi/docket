# Security posture — AppRank MVP

## Verified (this build)
- **Secrets:** no keys/tokens committed. All config via env (`DATABASE_URL`, `MCP_API_KEY`); `.gitignore` excludes `.env*`. Repo-wide grep for `sk-`/`AKIA`/private-key patterns = clean.
- **MCP auth (fail-closed):** if `MCP_API_KEY` is unset the server returns `401` for every request (no anonymous access). Bearer tokens compared with `crypto.timingSafeEqual` (constant-time, length-guarded). Verified live: no header → 401, wrong key → 401, correct key → 200.
- **Input validation (single source of truth):** `packages/core/src/validate.ts` is shared by the web form, the API routes, and the MCP server, so all three accept identical input. Length caps on name/tagline/category, strict URL (http/https + valid host) and email validation, x_handle character whitelist, whitespace trimming.
- **SQL injection:** all queries are parameterized (`$1…$n` via node-postgres); no string interpolation in any query. Confirmed by grep across `packages/core/src`.
- **XSS:** React escapes output by default; no `dangerouslySetInnerHTML` / `innerHTML` anywhere in the app (confirmed by search).
- **No destructive MCP tools**, no shell execution, no eval. Client-rendered board uses React text nodes only.
- **Error handling:** API routes catch and return generic 500s (no internal detail leakage); the landing page's board fetch degrades to an empty state if the DB is unavailable instead of crashing SSR.

## Known findings (pre-launch dependency pass — REQUIRED before public launch)
`npm audit` reports 7 issues (4 moderate, 2 high, 1 critical), all in the **dependency graph** and none exposed at our runtime routes:
- **esbuild** (via `vitest`): dev-server only, not shipped.
- **postcss** (bundled under `next`): build-time CSS processing, not served to users.
- Remaining issues sit in the `next`/`vitest` chains.

Fixes require **breaking** major upgrades (`next@16`, `vitest@4`) that were out of scope for this MVP slice. Before the site goes public, run:
```bash
npm audit            # re-check
npm audit fix --force  # pull next@16 / vitest@4, then rebuild + re-run the full suite
```
(Or pin the patched majors explicitly once the brand/launch date is set.)

## Future hardening (not MVP)
- **Rate limiting** on `POST /api/listings` and `/api/subscribe` (spam/triage is deferred by design; the MVP auto-publishes all listings). Add a simple in-memory or Supabase-backed limiter before opening public submission at scale.
- **MCP scoped API keys** (`listing:read/write`, `blast:manage`, `analytics:read`) and OAuth for humans — SPEC §23.1.
- **CSRF/origin checks** on the web API routes once cross-origin clients exist (currently same-origin only, so not exploitable).
