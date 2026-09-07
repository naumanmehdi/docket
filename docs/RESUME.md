# RESUME HERE — handoff for the next session (updated 2026-09-07, session ~1M)

Read this + `ARCHITECTURE.md` + `SECURITY.md` first, then `git status`. Don't re-derive anything — it's all below.

## Current git state (IMPORTANT)
- **You are on branch `redesign/soft-cream`** — this holds ALL the recent work (design port, rename,
  feedback, security). It is **7 commits ahead of `main`** and **NOT merged, NOT pushed**.
- `origin/main` = old clean deploy state (Step B live on temp URL). The new branch work is local-only.
- **Next step is a decision, not a build:** merge `redesign/soft-cream` → `main`, set `MCP_ADMIN_KEY`,
  apply migration 0003, deploy. See "Open items / decisions".

## Brand
**Name: `docket` · Domain: `rundocket.xyz`** (lowercase everywhere). npm scope was renamed
`@apprank/*` → `@docket/*` across ALL code this session (imports, package.json ×3, vercel.json, CI,
seed/tests) + `createApprankServer` → `createDocketServer`. Build + 75 tests green under new scope.

## What was done since the last handoff (2026-09-07)
### FEEDBACK feature — completed + wired into the app
- `feedback` table (SEPARATE from `listings` — never on the public board/search). Migration `0003_feedback.sql`.
- Intake: `POST /api/feedback` (web, rate-limited 15/10min) + MCP `feedback` tool (public submit).
- Digest: MCP `top_feedback` (OWNER-only, gated by `MCP_ADMIN_KEY`). Public key can submit, cannot read.
- **No tool lock-in:** digest is a plain Postgres view `feedback_top_asks` — `select * from feedback_top_asks;`.
- Known limitation (do not ship silently): clustering is a cheap prefix bucket — exact repeats collapse,
  rephrased variants split. Upgrade to `pg_trgm`/embeds when volume grows.
- The "Your note" feedback form is now LIVE in the web app (wired to POST /api/feedback).

### DESIGN — locked 008 + PORTED into the app
- Locked direction: **soft-cream + docket-tab motif** (Editorial Luxury, light). Comp at
  `design-sketches/008-final-docket/index.html`.
- **Ported into the live app** (front-end only — globals.css + components + copy; data/API/MCP untouched):
  - `globals.css`: warm cream paper `#fbf7ef` + espresso ink `#26190f` + single ember accent `#d9743f`,
    de-pilled radii, warm shadows, film grain, editorial split hero, floating island nav,
    binder-tab category cards, docket-edge board rows, structured footer + feedback styling.
  - `Landing.tsx`: 2-col editorial hero, step-by-step terminal (install/publish/find/check), live FeedbackNote,
    structured footer with "Made with ❤️ by @naumanmehdi" credit.
  - `Catalog.tsx`: category buttons emit `data-label` for binder tabs; active Everything wide (4-col).
  - `PublishModal.tsx`: "Web" tab + 3-step form (kind → fields → handle) + agent step pane; no emoji.
  - `copy.ts`: reorganized into navigable structure; `layout.tsx` fonts → Plus Jakarta + Fraunces italics.
- Verified: build clean, 75 tests pass, visual check (cream, tabs, no breakage).

### SECURITY — audited + hardened (see SECURITY.md for full posture)
- SQL injection SAFE (all queries parameterized; verified live — `' OR 1=1 --` stored inert).
- XSS SAFE (no sinks; React escapes; verified live with script/onerror payloads).
- Prompt injection: MCP `search`/`get_listing`/`my_ideas` tool descriptions now label content UNTRUSTED DATA.
- Removed `config.ts` `?? "dev-key"` fallback (now fail-closed if MCP_API_KEY unset).
- Scrapped leaked Supabase creds from git history + expunged local leftovers (reflog/original). Remote clean.
- MCP two-tier auth (public/admin) verified live.
- **`npm audit` = 8 issues (5 mod, 2 high, 1 crit) — ALL dev/test-only** (vitest UI [crit], esbuild, postcss,
  qs). None at runtime routes. Pre-launch: run `npm audit fix --force` then re-test.

## Accounts & secrets (unchanged)
- **GitHub:** `naumanmehdi` (doc said `nauman388`; actual login `naumanmehdi`). Repo `naumanmehdi/docket`.
- **Supabase:** project `mgzjmjjrcuiwdvjvonzn` ("docket"). Token/password/conn → `~/Hermes/notes/app_accounts.md`.
- **Vercel:** user `nauman-dev`, project `naumandevs-projects/docket`. `DATABASE_URL` set (all envs).

## Open items / decisions (next session)
1. **Deploy this branch (the main task, blocked on a yes from the user):**
   `git checkout main && git merge redesign/soft-cream` → set `MCP_ADMIN_KEY` on Vercel →
   apply `supabase/migrations/0003_feedback.sql` to prod → `vercel --prod` → run `npm audit fix --force` first.
2. **Custom domain** — point `rundocket.xyz` at Vercel (finishes the agent front door; `randoke.xyz/mcp`
   is what llms.txt advertises).
3. **Idea-lifecycle web UI** — OPEN (agent/MCP-only now). Decide if human claim/build buttons wanted.
4. **GitHub auto-deploy** — Vercel identity lacks repo write access; needs Vercel GitHub App or creds.
5. **Per-identity MCP keys** — future hardening for a public marketplace (shared key OK for pilot).

## Files that matter (quick index)
- `docs/RESUME.md` · `docs/ARCHITECTURE.md` · `docs/SECURITY.md` · `docs/DESIGN-VISION.md`
- `packages/core/src/brand.ts`, `apps/web/lib/site.ts` → name/domain
- `apps/web/lib/copy.ts` → ALL user-facing copy
- `apps/web/app/globals.css` → design tokens
- `apps/web/app/_components/{Landing,Catalog,PublishModal}.tsx` → front-end
- `apps/web/app/api/{listings,feedback,mcp}/route.ts` → web endpoints
- `packages/mcp/src/server.ts` → MCP tools (9: publish, search, get_listing, claim_idea, update_claim,
  my_ideas, list_idea_activity, feedback, top_feedback)
- `supabase/migrations/*` (0001, 0002, 0003) → schema
- `scripts/seed.mjs` · `scripts/verify_feedback.mjs` · `.env.example` · `vercel.json`
- `design-sketches/008-final-docket/index.html` → locked comp
- Planning: `~/Hermes/apprank/apprank_idea/pm_wayfinder/{MVP,SPEC,MAP}.md`

## Do NOT
- Re-explain the product (planning docs + this handoff have it).
- Touch another profile's files.
- Assume an open item is decided — ask the user.
- Rename the DB/folder `apprank` (those are live infra connections, not brand).