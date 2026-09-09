# Security — docket

## Verified (this build, incl. live attack tests)
- **Secrets:** no keys/tokens committed or in git history. Leaked Supabase creds from an earlier session were scrubbed with `git filter-branch`; local leftovers (`refs/original/`, reflog) expunged. `.gitignore` excludes `.env*`.
- **MCP auth:** `MCP_API_KEY` (public submit) + `MCP_ADMIN_KEY` (owner-only digest). If unset, every request → 401. Bearer tokens compared with `crypto.timingSafeEqual`. `config.ts` has **no secret fallback** — throws if `MCP_API_KEY` is unset.
- **Two auth tiers:** `top_feedback` gated by `MCP_ADMIN_KEY`. External clients on the shared public key can submit but cannot read the private digest.
- **SQL injection: SAFE.** Every query parameterized (`$1…$n` via node-postgres); no user string concatenated into SQL. ORDER BY/LIMIT use hardcoded columns + parameterized limits. Verified live with `' OR 1=1 --` — stored as inert literal text.
- **XSS: SAFE.** Zero `dangerouslySetInnerHTML` / `innerHTML` / `document.write` sinks; React escapes all output. Verified live with `<script>`/`onerror` payloads — stored as inert text on owner-only surface.
- **No shell/exec/eval** in source; only `RegExp.exec` in auth.
- **Prompt injection:** `search`, `get_listing`, `my_ideas` tool descriptions label returned content as **UNTRUSTED USER-SUBMITTED DATA**, not instructions — mitigates a malicious listing manipulating the reading agent.
- **CORS:** no `access-control-allow-origin` anywhere → browser preflight blocks cross-origin JSON. Not exploitable.
- **Rate limiting:** web write endpoints capped per-IP — `/api/listings` 5/10min, `/api/feedback` 15/10min.
- **Error handling:** API routes return generic 500s; no internal detail leaked. Board fetch degrades to empty state if DB unavailable.

## Dependency audit
- **next 16.2.12: CRITICAL** — unauthenticated RCE on Windows-hosted servers (GHSA-p293-qw3h-jr36). Not exploitable on Vercel (Linux). Pinned for Vercel deploy compatibility (16.3.4 builds but cannot deploy on current pipeline).
- **postcss: HIGH** — XSS via unescaped `</style>` in CSS stringify output. Build-time only, not invoked at runtime.
- **sharp: HIGH** — libvips CVEs (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591). sharp is a next dependency but `next/image` is never used in source — not exploitable at runtime.
- Re-run `npm audit fix --force` when Vercel supports next 16.3+ deploy.

## Future hardening (not MVP)
- Per-identity MCP keys (`listing:read/write`, `feedback:read`, admin) — shared key OK for pilot.
- CSRF/origin checks on web API routes once cross-origin clients exist.
- `pg_trgm` / embedding clustering for feedback once volume grows.
