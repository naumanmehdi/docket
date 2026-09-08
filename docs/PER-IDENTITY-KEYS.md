# Per-identity MCP keys — scope doc

## Question
Should we build per-identity MCP keys + a simple registration endpoint so users can self-serve, instead of the current shared-key model where you hand out keys manually?

## Current state
- Single shared `MCP_API_KEY` (public submit) + `MCP_ADMIN_KEY` (owner digest)
- You own the keys; no signup flow; no per-user attribution
- Works for trusted pilot; not public-ready

## Critical clarification
The **web form** (`POST /api/listings` + `POST /api/feedback`) is **already open to anyone** — no MCP key required. The MCP key is only for the agent endpoint (`/mcp`). So:
- Anyone can publish/feedback via the web form right now
- Only agents need the MCP key for `/mcp`

## Option A: Leave as-is
- No code changes
- You hand out keys manually
- Fine for pilot, no public access

## Option B: Per-identity keys + registration (medium scope, ~$0-20/mo)

### What changes
- **New table:** `mcp_keys` (id, key_hash bcrypt/argon2, owner email/handle, scopes read/write/admin, created_at, last_used_at, revoked, invite_code)
- **Auth layer:** `packages/mcp/src/auth.ts` — hash incoming bearer token → query `mcp_keys` → check scopes + revoked
- **Tool gating:** `packages/mcp/src/server.ts` — scope check on key record instead of `feedbackAdminKey` env var
- **Web route:** `apps/web/app/api/mcp/route.ts` — lookup key instead of env-var compare
- **New endpoint:** `POST /api/mcp-keys/register` — takes invite_code + email/handle, returns plaintext key (shown once), rate-limited

### What doesn't change
- All 9 MCP tools stay the same
- Web UI, feedback, llms.txt, board — untouched
- Design, copy, migrations 0001-0003 — untouched

### Files touched
- `supabase/migrations/0004_mcp_keys.sql` (new)
- `packages/core/src/listings.ts` (add `mcp_keys` store methods)
- `packages/mcp/src/auth.ts` (key-lookup + scope check)
- `packages/mcp/src/server.ts` (tool gating via scopes)
- `apps/web/app/api/mcp/route.ts` (auth via key lookup)
- `apps/web/app/api/mcp-keys/route.ts` (new registration endpoint)
- `packages/mcp/test/auth.test.ts` (new tests)

### What you get
- Users go to `/register`, enter invite code + email, get a key
- Paste key into MCP client config
- Scopes: `read` (search/get), `write` (publish/claim/feedback), `admin` (top_feedback)
- You can revoke keys from DB
- Existing `MCP_API_KEY` + `MCP_ADMIN_KEY` become "master keys" for backward compatibility

### Budget impact for option B
**Free tier possible if:**
- No email verification (just store email, no verification step)
- Self-serve registration with invite codes only
- Supabase free tier handles the key table (tiny, <1000 keys)
- Vercel free tier handles the endpoints

**Paid tier needed if:**
- Email verification (Resend free tier = 100 emails/day, then $1/1000 emails)
- >1000 keys or high request volume
- Need a dashboard UI (additional dev time)

### Platforms suited for B (cheap auth)
1. **Supabase + no email verification** — $0. Just store email, no auth provider. Fastest to build.
2. **Supabase Auth** — $0 for <10k MAU. Built-in email verification, magic links. Most complete.
3. **Clerk** — free tier for <10k MAU. Drop-in auth, no DB schema changes. Easiest to integrate.
4. **Firebase Auth** — free tier unlimited. Phone/email auth, but adds Google dependency.
5. **Resend only** — $0 for 100 emails/day. Use with Supabase for custom email verification.

**Recommendation:** Supabase free tier + no email verification + invite codes = $0, 2-3 hours to build, no ongoing cost until you hit scale.

## Option C: Invite codes (middle ground, $0)
- You generate invite codes manually (or via a simple admin endpoint)
- Users enter code at `/register` to get a key
- No email verification needed
- Still $0 on Supabase/Vercel for small scale
- You keep control, but users can self-serve within your invite pool
- Scope changes: same as B but simpler (no email service, no verification)

#### Rate limiting + usage logging

**Table:** `mcp_rate_limits`
```sql
CREATE TABLE mcp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES mcp_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  requests INT NOT NULL DEFAULT 1,
  UNIQUE(key_id, window_start)
);
CREATE INDEX idx_rate_limits_key_window ON mcp_rate_limits(key_id, window_start);
```

**Logic:**
- On each MCP request: check if a row exists for `key_id` + current hour window
- If exists and `requests >= limit` → 429 Too Many Requests
- If exists and `requests < limit` → increment counter
- If no row → insert new row with `requests = 1`

**Default limits:**
- Read tools (search, get_listing): 100/hour
- Write tools (publish, claim, feedback): 20/hour
- Admin tools (top_feedback): 10/hour

**Cleanup:** Run `DELETE FROM mcp_rate_limits WHERE window_start < now() - interval '30 days'` monthly.

**Cost:** Free tier safe. Each request adds 1-2 DB queries. Table stays small with cleanup.

---

## Admin: generate invite codes + analytics

### What you'd see

**Per code:**
- Code string, max uses, used count, remaining uses
- Status: active / maxed out / expired / revoked
- Created date, expiry date
- % utilization (e.g. 8/10 used = 80%)

**Per key:**
- Owner (email/handle)
- Scopes (read/write/admin)
- Which invite code was used to create it
- Last used timestamp
- Status: active / revoked
- Age (how long since created)

**Aggregate:**
- Total codes created
- Total active keys
- Total revoked keys
- Requests in last 7 days (rough activity metric)
- Codes about to expire (if you set expiries)

### When to revoke a key

**Automatic triggers (you'd see these in the admin UI):**

1. **Key is old and unused** — e.g., created 30+ days ago, never used. Might be a leaked code someone grabbed but didn't use. Safe to revoke.

2. **Abnormal usage pattern** — e.g., one key making 500 requests in an hour while others average 5/day. Could be someone sharing their key publicly, or a script abusing the endpoint.

3. **Code is fully used and you're seeing traffic from it anyway** — means someone is reusing/forwarding a key after the code was maxed out. Shouldn't happen, but if it does, revoke the key.

4. **You get feedback that something feels off** — a specific user is spamming, publishing garbage, or you just don't want them anymore. Revoke their key.

**Manual triggers (your call):**

5. **Someone asks for their key removed** — they lost it, want out, whatever. Revoke it.

6. **You're shutting down a beta/test run** — revoke all keys from a specific invite code batch.

7. **You see a leak** — if you posted a code publicly and it got shared more than expected, revoke remaining keys from that code and generate a new batch.

### How you'd know

**From the admin page:**
- Sort keys by "last used" — stale keys stand out
- Sort by usage frequency — outliers pop up
- Filter by invite code — see which batch is misbehaving

**What's NOT automated (by design, for $0 cost):**
- No email alerts
- No rate-limit warnings
- No anomaly detection

If you want those, you'd need to:
- Add per-key rate limiting in the API (count requests per key per hour, return 429 if exceeded)
- Log request patterns and review periodically
- Or upgrade to a monitoring tool later

For now, the workflow is: you log into `/admin`, scan the tables, revoke what looks off. Takes 2 minutes, costs $0.

**Option A — Admin endpoint only (minimal, ~30 extra lines):**
```
POST /api/admin/invite-codes
Authorization: Bearer *** (your master key)
Body: { "code": "DOCKET-ALPHA-1", "max_uses": 5, "expires_at": "2026-12-31" }
```

**GET /api/admin/invite-codes** — list all codes with usage stats:
```json
[
  {
    "code": "DOCKET-ALPHA-1",
    "max_uses": 5,
    "used_count": 2,
    "revoked": false,
    "expires_at": "2026-12-31",
    "created_at": "2026-09-07"
  }
]
```

**GET /api/admin/mcp-keys** — list all issued keys:
```json
[
  {
    "id": "uuid",
    "owner": "user@example.com",
    "scopes": ["read", "write"],
    "invite_code": "DOCKET-ALPHA-1",
    "last_used_at": "2026-09-07T15:00:00Z",
    "revoked": false,
    "created_at": "2026-09-07"
  }
]
```

**POST /api/admin/mcp-keys/revoke** — revoke a key:
```json
{ "id": "uuid" }
```

**Option B — Admin page (bonus, ~100 extra lines):**
Simple HTML page at `/admin` (gated by your master key):
- Create invite codes (form: code, max uses, expiry)
- See all codes + usage counts
- See all issued keys + last used
- Revoke keys with one click
- No framework needed — plain HTML + fetch

**Recommended:** Build Option A now, add Option B later if you want a UI.

### Admin endpoints — auth
All admin endpoints check for your master key (`MCP_API_KEY` or `MCP_ADMIN_KEY`) in the Authorization header. If missing or wrong → 401.

### Admin endpoints — files
- `apps/web/app/api/admin/invite-codes/route.ts` (new, GET + POST)
- `apps/web/app/api/admin/mcp-keys/route.ts` (new, GET + POST for revoke)
- Optionally: `apps/web/app/admin/page.tsx` (simple HTML admin UI)
- Per-key rate limits
- Key rotation UI

### Trade-offs
- **Before:** Simple. You own the key, hand it out. No signup, no DB table, zero friction.
- **After:** Users self-serve, but you now have a key table to manage, a registration endpoint to secure, and scope logic to maintain. Auth path is now a DB query per request (fast with index on `key_hash`, but not free).

## Decision needed
- Build per-identity keys (B) or leave as-is (A)?
- If B, invite codes (C) or open registration?
- Email verification needed, or skip for $0?

## Analytics (recommended, $0)

**Enabled in Vercel dashboard, no code changes:**
- Page views, top pages, referrers
- Enough for launch

**What you already have without adding anything:**
- Publish volume (from `listings` table)
- MCP tool call volume (from route logs / rate-limit table)
- Error rate (401s, 429s, 500s)

**What NOT to add (privacy-first, no tracking bloat):**
- No third-party analytics scripts (Google Analytics, Plausible, PostHog, etc.)
- No user tracking across sessions
- No cookies, no fingerprinting

**Other $0 analytics tools worth knowing about:**
- **PostHog:** Full product analytics (events, funnels, sessions). Free tier: 1M events/month. Overkill for launch. Adds script to your site. Only worth it if you need event-level analysis later.
- **Plausible:** Simple page-view analytics. Free tier: none (paid only, ~$9/mo). Not $0.
- **Umami:** Open-source, self-hosted analytics. Free if you host it yourself, but that's infrastructure you have to maintain.
- **Vercel Analytics:** Built-in, free on Vercel free tier. Page views + top pages. Zero code.

**When to add more:**
- When you have specific questions Vercel Analytics can't answer (e.g., "which search queries return zero results?")
- When you're ready to instrument specific events in the app
- Not needed for launch

## Build order (suggested)

---

## BUILD STATUS — updated by apprank session (backend agent), Sep 08 2026

> Working branch `feature/per-identity-keys`. Backend is **complete + tested + E2E-verified + COMMITTED**.
> Front-end is split across TWO sessions and is being reconciled separately by the user.
> Read this whole appendix before merging or writing more front-end, so neither half is lost.

### ⏱ Status log
- **Sep 08 — backend COMMITTED** to `feature/per-identity-keys` as **`738f52b`** (`feat(access): invite-code-gated per-identity MCP keys + admin backend`). Scope: the 18 backend/admin files below. This doc + appendix are now **tracked** (committed in `738f52b`).
- aipm session committed `7fcb0cb` (`docs: update RESUME.md`) earlier on the same branch.

### Reconcile note (added after reviewing aipm's RESUME.md, commit `7fcb0cb`)
- aipm's RESUME `7fcb0cb` (committed on `feature/per-identity-keys`) is the OTHER session's doc. Its **"Recent changes" block is accurate**; but its **"Next session: invite code system → What to build" section is STALE** — it still lists migration/core/auth/admin/register as unbuilt. **Do NOT rebuild those; they are DONE below.**
- The nav in current code reads `Explore | The board | MCP | Publish` (`copy.ts`: `connect: "MCP"`) and links to **`/connect`, which has NO route yet** → resolve which register/connect page survives and point the link at it (see "What's left after merge").

### Verify the backend (for the other session) — HOW
On branch `feature/per-identity-keys`:
```bash
# 1) Confirm the commit landed + contains the backend:
git log --oneline -2          # expect 738f52b + 7fcb0cb at tip
git show --stat 738f52b        # 18 files: migration 0004, access.ts, auth/server scoping, admin routes + page

# 2) Confirm the code is present on the branch:
git show 738f52b:supabase/migrations/0004_invite_codes_and_keys.sql | head -5
git ls-tree 738f52b --name-only apps/web/app/api/admin apps/web/app/admin

# 3) Tests green:
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test   # core 61, mcp 35
# 4) Web builds:
npm run build --workspace @docket/web
```
Migration `0004` is already applied to local `apprank` + `apprank_test`.

### Backend — DONE + COMMITTED (mine, non-overlapping, in `738f52b`)
All implemented on `feature/per-identity-keys` and verified locally against Postgres.

| Area | File(s) | Notes |
|---|---|---|
| Migration | `supabase/migrations/0004_invite_codes_and_keys.sql` | `invite_codes`, `mcp_keys`, `mcp_rate_limits`. Applied to `apprank` + `apprank_test`. |
| Core store | `packages/core/src/access.ts` (+ exported in `index.ts`) | create/list/revoke codes; issue key in a txn w/ `FOR UPDATE` row lock (no overshoot); sha256 hash lookup; revoke key; hourly `consumeRate`. Partial-unique index = one active key per owner. |
| Access types | `packages/core/src/index.ts` | exports `AccessStore`, `KeyScope`, helpers, `DEFAULT_KEY_RATE_PER_HOUR`. |
| Auth | `packages/mcp/src/auth.ts` | new async `resolveAuth(headers, deps)` → scopes. Precedence: `MCP_ADMIN_KEY`(read+write+admin) → `MCP_API_KEY`(read+write) → DB key by sha256. Fail-closed. Old `authorize` kept. |
| Server gating | `packages/mcp/src/server.ts` | each tool scope-gated (`read`/`write`/`admin`); `scopes` dep added; `feedbackAdminKey` still honored for owner tool when no scopes passed. |
| MCP index | `packages/mcp/src/index.ts` | re-exports `resolveAuth` + types. |
| MCP route | `apps/web/app/api/mcp/route.ts` | calls `resolveAuth`; DB-issued keys get hourly limit (`consumeRate`, 100/hr) + `markKeyUsed`. Master keys skip rate limit. |
| Web store | `apps/web/lib/store.ts` | adds `getAccessStore()`; shares one pool. |
| Admin helper | `apps/web/lib/admin-auth.ts` | `isAdminRequest` (admin **or** public master key). |

**Endpoints — DONE (mine):**
- `GET/POST /api/admin/invite-codes` — list w/ status; mint 1..many (`{code?,prefix?,count?,max_uses,scopes?,expires_at?}`)
- `POST /api/admin/invite-codes/revoke` `{id}`
- `GET /api/admin/mcp-keys` — list owner/scopes/invite/status/last_used
- `POST /api/admin/mcp-keys/revoke` `{id}`
- `POST /api/mcp-keys/register` — **see contract note below**
- All admin routes gated by `isAdminRequest` (401 otherwise).

**Tests:** core **61** (14 new in `packages/core/test/access.test.ts`), mcp **35** (9 new: `resolveAuth` in `auth.test.ts`, scope gating in `server.test.ts`). Run: `DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test`. All three packages build (`npm run build --workspace @docket/core|mcp|web`).

**E2E verified live** (dev server on local Postgres): 401 w/o admin key → mint code → list → register (bad code 400 / good code 201 returns `dk_…`) → duplicate-owner 400 → revoke flips key to revoked → `/api/mcp` accepts issued key, rejects bad token. Test rows cleaned up.

### Front-end — SPLIT, being reconciled by user in another session (aipm)
- **`apps/web/app/admin/page.tsx` (MINE, non-overlapping):** full owner back-office — gate screen (admin key → sessionStorage, not cookie), stats cards, invite-codes table w/ status tags + revoke, issued-keys table w/ revoke, bulk-generate modal (count/max-uses/expiry) with copy-all. Reuses global design tokens. **COMMITTED in `738f52b`.**
- **`apps/web/app/register/page.tsx` (MINE, OVERLAPS the aipm front-end):** self-serve redeem → show key once. **HELD — NOT committed; still untracked in the working tree. User reconciling with other session.**
- **`apps/web/app/api/mcp-keys/register/route.ts` (MINE):** NOT included in `738f52b` (it's part of the register flow being reconciled). Still **untracked**. Backend register logic is written + E2E-tested locally but not yet committed.
- **`apps/web/app/_components/Landing.tsx` + `apps/web/lib/copy.ts` (aipm session):** added homepage nav link (label now reads "MCP") → `/connect` + a `connect` copy key. **Not mine — leave alone.** (aipm also has edits to `globals.css`, `next-env.d.ts` uncommitted.)
- **`design-sketches/mcp-setup.html`, `design-sketches/register.html` (aipm session):** mockups. `register.html` matches `admin.html` styling. **Not mine — leave alone.**

### ⚠️ Register contract mismatch — RESOLVE BEFORE MERGE
The two sessions disagree on `/api/mcp-keys/register`. My backend ships the `PER-IDENTITY-KEYS.md`-plan shape; the aipm sketch uses a different shape. Pick ONE (recommended: backend, since it's built + tested):

| | My backend (built, untracked) | aipm sketch `register.html` |
|---|---|---|
| POST body | `{ code, owner }` | `{ invite_code, owner }` |
| Success | `{ ok, plaintext, scopes, owner, created_at, note }` | `{ key }` |
| Error | `{ ok:false, errors:[...] }` + 4xx | `{ error }` |

Options: (a) keep backend contract, adapt aipm UI to it; (b) make backend tolerant — accept `code` **or** `invite_code`, return key under **both** `plaintext` and `key`. If you choose (b), that edit is small and only in `apps/web/app/api/mcp-keys/register/route.ts`.

### What's left after merge
1. **Commit the register flow** — `apps/web/app/api/mcp-keys/register/route.ts` (+ resolve its contract first). Not yet in git.
2. Wire ONE register UI (backend contract) to whichever route survives (`/register` vs `/connect`) — reconcile, don't keep two.
3. Decide whether `/connect` nav should point at the surviving register page (currently a dangling link).
4. Re-run tests + `npm run build --workspace @docket/web`, then merge `feature/per-identity-keys` → main, preview deploy, push.
5. Commit the aipm front-end files (`Landing.tsx`, `copy.ts`, `globals.css`, `next-env.d.ts`) + `commands.md` + mockups when aipm's side is done.

### Don't
- Re-build the backend (done). Re-do front-end work the user is already reconciling.
- Commit secrets. Rename DB `apprank`. Touch another profile's files.

