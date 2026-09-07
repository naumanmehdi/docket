# Security posture — docket

## Verified (this build, incl. live attack tests)
- **Secrets:** no keys/tokens committed or in git history. Prior leaked Supabase creds
  (in `docs/RESUME.md`) were scrubbed with `filter-branch`; the local leftovers
  (`refs/original/`, reflog) were expunged with `git reflog expire --all` + `git gc --prune=now`.
  Verified: no secret matches in any reachable git object. All config via env; `.gitignore`
  excludes `.env*`.
- **MCP auth (fail-closed):** `MCP_API_KEY` (public) + `MCP_ADMIN_KEY` (owner). If unset, the
  server returns `401` for every request. Bearer tokens compared with `crypto.timingSafeEqual`.
  `config.ts` has NO secret fallback (the old `?? "dev-key"` default was removed and now throws
  if `MCP_API_KEY` unset — so it can never silently lower security). Verified live: no/wrong key
  → 401, correct public key → submit, admin key → owner tools.
- **Two auth tiers (owner tools):** `top_feedback` is gated by `MCP_ADMIN_KEY`. External clients
  on the shared public key can submit feedback but CANNOT read the private digest. Verified live.
- **SQL injection: SAFE (verified).** Every query is parameterized (`$1…$n` via node-postgres);
  no user string is ever concatenated into SQL. The clause/SET builders in `listings.ts` only ever
  emit fixed SQL + `$N` placeholders with values passed as args; ORDER BY/LIMIT use hardcoded
  columns + parameterized limits. Verified live: `' OR 1=1 --` submitted as a message was stored
  as inert literal text, not executed.
- **XSS: SAFE (verified).** Zero `dangerouslySetInnerHTML` / `innerHTML` / `document.write` sinks;
  React escapes all output. Verified live: `<script>`/`onerror` payloads stored as inert text on an
  owner-only surface (never rendered to other users).
- **No shell/exec/eval** anywhere; the only `.exec` is a regex `RegExp.exec` in auth.
- **Prompt injection (hardened):** the MCP `search`, `get_listing`, and `my_ideas` tool descriptions
  now explicitly warn the consuming agent that returned listing content is UNTRUSTED USER-SUBMITTED
  DATA, not instructions — mitigating a malicious listing trying to manipulate the reading agent.
  (This is inherent to any MCP that surfaces user content; the guard + consumer-side handling is
  the practical mitigation.)
- **CORS:** no `access-control-allow-origin` set anywhere → cross-origin JSON POSTs are blocked by
  the browser CORS preflight. Not exploitable.
- **Error handling:** API routes catch and return generic 500s; no internal detail leaked. Board
  fetch degrades to empty state if DB unavailable.
- **Web write endpoints are rate-limited** per-IP: `/api/listings` (5/10min), `/api/feedback`
  (15/10min).

## Known findings (pre-launch dependency pass — REQUIRED before public launch)
`npm audit` reports 8 issues (5 moderate, 2 high, 1 critical), all in the **dependency graph**
and NONE exposed at our runtime routes:
- **vitest** (critical) — the vitest UI preview server (arbitrary file read/exec). Dev/test-only;
  not shipped, not reachable in the deployed app (would require running `vitest --ui` locally).
- **esbuild** (moderate) — dev server, via vitest; not shipped.
- **postcss** (high) — bundled under `next`, build-time CSS only, not served.
- **qs** (moderate) — transitive; confirmed NOT imported at runtime (no `require("qs")` in app code).

Fixes require **breaking** major upgrades (`next@16`, `vitest@4`) that are out of scope for this
slice. Before the site goes public, run:
```bash
npm audit            # re-check
npm audit fix --force  # pulls next@16 / vitest@4, then rebuild + re-run the full suite
```
(Or pin the patched majors explicitly once the launch date is set.)

## Future hardening (not MVP)
- **Per-identity MCP API keys** (`listing:read/write`, `feedback:read`, admin) — the shared-key
  model is fine for a trusted pilot; per-identity keys + attribution are the real open-marketplace
  answer once public callers exist.
- **CSRF/origin checks** on web API routes once cross-origin clients exist (currently CORS-blocked).
- **pg_trgm / embedding clustering** for feedback once volume grows (not a security issue).