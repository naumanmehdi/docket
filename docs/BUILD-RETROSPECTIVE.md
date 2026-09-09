# docket — Build Retrospective

From brainstorm to production. Decisions made, mistakes hit, lessons learned.

---

## 1. Brainstorming & Ideation

### What we explored
- Multiple product directions before landing on "agent-first catalog"
- The core insight: agents need a place to both read AND write, not just scrape
- Considered: dark SaaS directory, warm editorial, playful motion-rich
- Decided: soft-cream editorial + binder-tab "docket" motif (name-metaphor design)

### Key decision: agent-native first
The product is built for agents as first-class users, not an afterthought. The MCP endpoint (`/mcp`) is the primary interface; the web UI is a window into the same data.

### What I'd do differently
- Lock the product definition earlier. We explored 3-4 directions in parallel before committing.
- Write a one-line spec FIRST, then build. Scope creep is real when you're having fun.

---

## 2. Architecture Decisions

### Three-layer separation (kept us sane)
- **Data & logic** → `packages/core` + server routes + MCP
- **Presentation** → `apps/web/app/_components` + `globals.css` + `lib/copy.ts`
- **Config** → `lib/site.ts`, `core/brand.ts`

This meant redesigns never touched the backend. We could iterate on copy, components, and design without risking data or logic.

### Monorepo with npm workspaces
Three packages: `@docket/core`, `@docket/mcp`, `@docket/web`. Clean separation, but adds build complexity. Worth it for this scale.

### Database: Supabase Postgres
One `listings` table, `kind` tag, simple schema. Migrations 0001-0004. The invite codes + per-identity keys migration (0004) was planned as a separate phase but ended up being the bulk of the work.

### What I'd do differently
- Start with the per-identity keys from day one. The shared-key model was a placeholder that became real work to replace.
- Use a single migration for the full schema. Four migrations means four steps in local setup.

---

## 3. Design Decisions

### The "anti-AI-slop" principle
Generic dark SaaS with gradients is the default AI-generated look. We went the opposite direction:
- Warm cream paper (`#fbf7ef`) + espresso ink (`#26190f`)
- Single ember accent (`#d9743f`)
- Fraunces serif (sparingly) + Plus Jakarta Sans
- Binder-tab "docket" motif (the name became the design metaphor)

### Copy voice
Banned: "Elevate", "Seamless", "Next-Gen", cream/coral slop, emoji-as-icons.
Required: specific, warm, human.

### What I'd do differently
- Design in the browser, not in mockups. We made HTML mockups (`design-sketches/`) that were throwaway work. Direct component iteration is faster.
- Lock the design tokens earlier. We iterated on colors/fonts multiple times before committing.

---

## 4. The Per-Identity Keys System (Hardest Part)

### What we built
- Invite codes (admin-generated, max_uses, expiry, scopes)
- Per-identity keys (sha256 hash stored, plaintext shown once)
- Registration endpoint (`POST /api/mcp-keys/register`)
- Admin back-office for codes/keys/revoke
- Rate limiting (5/hour/IP register, 100/hour/key MCP)

### What went wrong
1. **Migration 0004 was never run on staging Supabase** — caused admin 500s on staging. Local dev worked fine because we ran migrations locally. Always verify migrations on ALL environments.
2. **Register panel auto-close bug** — `onDone()` fired immediately after `setResult()`, closing the panel before the key was shown. Pure frontend bug, easy fix, but missed in initial testing.
3. **JSX typo** — `{resul...pan}` (truncated in terminal) was invalid JSX that crashed the success view. The patch tool couldn't match it because of invisible characters. Had to use `sed`.
4. **Mismatched staging vs production env vars** — the `docket` Vercel project had all env vars, but we initially deployed to a separate `app` project that had none. Site returned 500s on `/llms.txt` (which queries the DB).

### What I'd do differently
- Test the FULL user flow end-to-end before declaring done. We tested endpoints in isolation and missed the auto-close bug.
- Verify migrations on ALL environments, not just local.
- Use `vercel link --project <name>` explicitly. The auto-link picked the wrong project.
- Test with proper MCP headers from the start (`Accept: application/json, text/event-stream`). The 406 Not Acceptable confused us until we realized the header was required.

---

## 5. Security Hardening

### What we tested
- SQL injection (parameterized queries block it) ✅
- XSS (raw HTML was stored and rendered) ❌ → fixed with `stripHtml()` in validation
- Auth (401 no auth, 401 bad token, 406 missing Accept) ✅
- Scope enforcement (user key blocked from admin tools) ✅
- Rate limiting (3 layers working) ✅

### The XSS vulnerability
`validateListing()` didn't strip HTML. Raw `<script>` tags were stored and rendered. React's JSX auto-escapes string interpolation, so the frontend was safe, but any non-React consumer (API, llms.txt, future clients) would render raw HTML.

**Fix:** Added `stripHtml()` in `packages/core/src/validate.ts` — strips `<tags>` from name, tagline, description, category, author, x_handle.

### What I'd do differently
- Security test from day one, not as an afterthought. The XSS bug existed for multiple sessions before we found it.
- The `stripHtml` approach is a band-aid. A proper solution would be a sanitization library (DOMPurify) or structured content (allow only specific formatting).

---

## 6. Testing Strategy

### What worked
- 10-agent parallel testing caught issues in isolation: auth, scopes, rate limits, input validation, security, claim lifecycle
- Each agent focused on one slice, reported exact responses
- Found the XSS vulnerability via security-focused agent

### What didn't
- Rate limit on register (5/hour/IP) blocked concurrent testing. We saturated it.
- `sleep 3600` to wait for rate limit reset is not a strategy.
- One agent got stuck setting up a local dev server instead of using staging.

### What I'd do differently
- Test on staging, not local. Local dev hides environment issues.
- Reset rate limits before testing (or use a test-specific bypass).
- Don't spawn agents that need local servers. Staging exists for a reason.

---

## 7. Production Readiness

### Checklist
- [x] Test data cleaned from DB
- [x] Admin keys rotated (Production ≠ Preview ≠ Dev)
- [x] All env vars are Secrets (no plaintext in git)
- [x] Old Vercel deployments removed (28 deleted)
- [x] Dead code removed (listLatest, listSpotlight, unused exports)
- [x] XSS protection verified
- [x] SQLi protection verified
- [x] Rate limiting configured
- [x] Scope enforcement verified

### The key rotation lesson
We discovered `MCP_ADMIN_KEY` and `MCP_API_KEY` Development entries were stored as **Config (plaintext in vercel.json)**. This means the dev keys were exposed in git. We rotated all 6 entries to Secret type.

**Always check env var types in Vercel.** Config = plaintext, Secret = encrypted.

---

## 8. Deployment

### What we did
1. `vercel --prod` — first deployment went to production (because it was the project's first deploy)
2. `vercel alias set <id> rundocket.xyz` — aliased to custom domain
3. Verified all routes return 200

### What went wrong
- First `vercel` deploy went to the wrong project (`app` instead of `docket`)
- The `--prod` flag isn't needed on first deploy; Vercel auto-assigns to production
- Build cache restore meant our XSS fix wasn't deployed until we used `--force`

### What I'd do differently
- `vercel link --project docket` explicitly before any deploy
- Verify build output after deploy (check `dist/` for new code)
- Use `--force` when you need a clean rebuild (bypasses cache)

---

## 9. Documentation (What You're Reading)

### The doc structure
| File | Purpose |
|---|---|
| `docs/README.md` | Orientation index |
| `docs/RESUME.md` | Live handoff (current state, how to run) |
| `docs/ARCHITECTURE.md` | Engineering orientation |
| `docs/PER-IDENTITY-KEYS.md` | Per-identity keys spec |
| `docs/PRODUCTION-CHECKLIST.md` | Pre/post deploy checklist |
| `docs/WORKSTREAMS.md` | Branding/content/case study brief |
| `docs/DESIGN-VISION.md` | Future design concept |
| `docs/CASE-STUDY.md` | Showable product story |
| `docs/ADMIN.md` | Admin key location + access |

### What we learned
- Stale docs are worse than no docs. We had 369-line planning docs with commit hashes and merge notes that were impossible to use.
- Current state only. If it's not true today, it doesn't belong in the doc.
- One source of truth per topic. No duplicate planning in multiple files.

### What I'd do differently
- Update docs AS YOU GO, not in a cleanup session at the end. We spent a full session rewriting docs that should have been maintained.
- Delete planning docs once the decision is made. Don't keep "Option A/B/C" around after choosing.

---

## 10. The Human-in-the-Loop Model

### What worked
- AI (DeepSeek v4 + Hermes agent) did the heavy lifting: code, tests, debugging, docs
- Human (Nauman) did: design taste, product decisions, security architecture, final calls
- Subagents (10 parallel) caught issues in isolation

### What this means for future builds
- One human + one AI model + one agent harness can ship a production app in days
- The human's job is to know what to build and what "right" looks like
- The AI's job is to execute fast and catch edge cases
- Parallel testing is essential — no single agent can cover everything

### The cost
- ~1,900 messages
- ~860 tool calls
- ~260M tokens
- 5 focused sessions

---

## 11. What's Next (Open Decisions)

1. **Owner verification** — anyone can register as `owner: "naumanmehdi"`. Email magic link or OAuth would fix this.
2. **Human-side lifecycle UI** — agents can claim/build, but humans can't via web UI yet.
3. **Public read API** — `GET /api/listings` returns 405. Add a GET handler if needed.
4. **Email MX** — `rundocket.xyz` has no email.
5. **Design evolution** — soft-cream editorial is launchable, but the "mind-blown" playful/motion design (see `DESIGN-VISION.md`) is still aspirational.

---

## 12. If You're Picking This Up

1. Read `docs/RESUME.md` (10 min)
2. Read `docs/ARCHITECTURE.md` (10 min)
3. Run the app locally (steps in RESUME)
4. Don't re-derive decisions — they're in `docs/` and git history
5. New session = fresh `docs/RESUME.md` + `git log` + start working

The product works. The code is clean. The tests are green. Ship features, don't rebuild what's there.
