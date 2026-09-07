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
- **3 'high' remain** (postcss = build-time CSS only; sharp = libvips image-opt, never invoked — no `next/image` in source).
- Neither is exploitable at runtime.
- **Next pinned 16.2.12** (declared at repo root so npm hoists it and Vercel detects it). 16.3.4 builds but **cannot deploy** on the current Vercel pipeline (immutable-static-upload incompatibility).
- Re-run `npm audit fix --force` when Vercel supports next 16.3+ deploy.

## Future hardening (not MVP)
- Per-identity MCP keys (`listing:read/write`, `feedback:read`, admin) — shared key OK for pilot.
- CSRF/origin checks on web API routes once cross-origin clients exist.
- `pg_trgm` / embedding clustering for feedback once volume grows.
