# RESUME HERE — handoff for the next session (updated 2026-09-07, DEPLOYED + LIVE)

Read this + `ARCHITECTURE.md` + `SECURITY.md` first, then `git status`. Don't re-derive anything — it's all below.

## Current git state (IMPORTANT)
- **You are on branch `main`.** `redesign/soft-cream` was merged → `main` (fast-forward), so `main` now
  holds everything (design, rename, feedback, security). `main` is **8 commits ahead of `origin/main`**
  (NOT pushed yet — push when ready; GitHub auto-deploy still not connected).
- **Deployed & LIVE.** docket runs at **`https://rundocket.xyz`** (custom domain, pointed at Vercel via
  Porkbun A record → `76.76.21.21`). Temp URL `docket-kbyjn5iik…vercel.app` also stays live as fallback.
- Everything below is now verified on the live site.

## Brand
**Name: `docket` · Domain: `rundocket.xyz`** (lowercase everywhere). npm scope was renamed
`@apprank/*` → `@docket/*` across ALL code (imports, package.json ×3, vercel.json, CI, seed/tests) +
`createApprankServer` → `createDocketServer`. Build + 75 tests green under new scope.

## DEPLOY / INFRA — current live state (2026-09-07)
- **Domain:** `rundocket.xyz` delegated to Vercel (Porkbun A `@` → 76.76.21.21; deleted parking ALIAS +
  wildcard CNAME). Vercel: owned, attached to project `docket`, verified, no conflicts. `/mcp`,
  `/llms.txt`, board all 200 on the live domain.
- **Secrets set on Vercel (all envs):** `DATABASE_URL`, `MCP_API_KEY`, `MCP_ADMIN_KEY` (admin key
  generated this session; store in `~/Hermes/notes/app_accounts.md`).
- **Migration 0003 applied to prod Supabase** (`feedback` table + `feedback_top_asks` view; 0 rows).
- **Dependencies:** pinned `next` to **16.2.12** and declared it at repo root so npm hoists it and
  Vercel's detector finds it. Next 16.3.4 builds locally but **cannot deploy** on the current Vercel
  pipeline (immutable-static-upload incompatibility + framework detection when nested under apps/web).
  `npm audit`: **3 'high' remain** (postcss = build-time only; sharp = never invoked — no `next/image`
  in source). Neither exploitable at runtime. `npm audit fix --force` → next 16.3.4 (breaks deploy).
- **To redeploy:** `vercel --prod` from repo root with `nvm use 20`.

## What was done (2026-09-07) — all live
### FEEDBACK feature — live
- `feedback` table (SEPARATE from `listings` — never public). Migration `0003_feedback.sql`.
- Intake: `POST /api/feedback` (web, rate-limited 15/10min) + MCP `feedback` (public submit).
- Digest: MCP `top_feedback` (OWNER-only, gated by `MCP_ADMIN_KEY`). Public key submits, cannot read.
- **No lock-in:** digest is plain Postgres view `feedback_top_asks` — `select * from feedback_top_asks;`.
- Known limitation (don't silently ship): prefix-bucket clustering collapses exact repeats, rephrased
  variants split. Upgrade to `pg_trgm`/embeds when volume grows.
- "Your note" feedback form is LIVE in the web app.

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
- **`npm audit` = 3 'high' remaining (postcss build-time, sharp never invoked).** The critical + 5 mod
  were cleared by `npm audit fix --force` (pulled vitest@4, next@16). Remaining 3 high are NOT
  exploitable at our runtime (no `next/image` in source → sharp never loads; postcss is build-time only).

## Accounts & secrets (unchanged)
- **GitHub:** `naumanmehdi` (doc said `nauman388`; actual login `naumanmehdi`). Repo `naumanmehdi/docket`.
- **Supabase:** project `mgzjmjjrcuiwdvjvonzn` ("docket"). Token/password/conn → `~/Hermes/notes/app_accounts.md`.
- **Vercel:** user `nauman-dev`, project `naumandevs-projects/docket`. `DATABASE_URL` set (all envs).

## Open items / decisions (next session)
1. **Deploy / live** — ✅ **DONE (2026-09-07).** Merged to main, `MCP_ADMIN_KEY` set, migration 0003
   applied to prod, deployed, custom domain `rundocket.xyz` live. `/mcp`, `/llms.txt`, board all serve.
2. **Push main → GitHub** — `main` is 8 commits ahead of `origin/main`, NOT pushed. `git push origin main`
   when ready (GitHub auto-deploy still not connected, so push doesn't auto-deploy).
3. **Idea-lifecycle web UI** — OPEN (agent/MCP-only now). Decide if human claim/build buttons wanted.
4. **GitHub auto-deploy** — Vercel identity lacks repo write access; needs Vercel GitHub App or creds.
5. **Per-identity MCP keys** — future hardening for a public marketplace (shared key OK for pilot).
6. **Email on rundocket.xyz** — no MX set up yet; add if you want `you@rundocket.xyz`.
7. **Dependency caveat** — 3 high remain (postcss build-time, sharp unused). Track future next 16.x
   releases: when Vercel supports 16.3+ deploy, `npm audit fix --force` again and redeploy.

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