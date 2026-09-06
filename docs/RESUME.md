# RESUME HERE — handoff for the next session (updated 2026-09-06)

Read this + `ARCHITECTURE.md` first, then `git status`. Don't re-derive anything — it's all below.

## Brand decided
**Name: `docket` · Domain: `rundocket.xyz`** — swapped everywhere (single-sourced in
`packages/core/src/brand.ts` + `apps/web/lib/site.ts`). User confirmed availability of rundocket.xyz.

## Where the project stands
The **agent-first catalog** build is **largely complete and committed** at `~/Hermes/apprank/app`
(git clean at `12cfb2c`). Not deployed. Backend (core data layer, MCP server, migrations, rate-limit),
web app (warm-dark design-D port), docs, and seed all done. 75 tests pass; production build passes.

## The user's immediate next step
**The user wants to DISCUSS the open items below first** (deploy/accounts, brand+domain, idea-lifecycle
web UI, design-vision) — NOT test the build yet. In a new session, open with those decisions and let the
user steer; do not jump to running/testing. To run the dev build when the user is ready:
```bash
# ~/Hermes/apprank/app  (Node 20 via nvm, local Postgres up, DB seeded w/ 31 rows)
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @apprank/web
# → http://localhost:3000
```

## Open items / decisions (user-owned unless stated)
1. **Deploy** — needs user accounts (GitHub repo + remote, Supabase project + `DATABASE_URL`, Vercel).
   Apply `supabase/migrations/*`; set env vars; deploy web + MCP. See root `README.md`.
2. ~~**Brand name + domain**~~ — **DONE 2026-09-06: `docket` / `rundocket.xyz`** (lowercase wordmark everywhere).
3. **Idea-lifecycle web UI** — OPEN. Lifecycle works agent/MCP-side only; web shows state but no
   claim/build buttons. Decide if a human web UI is wanted (would be small). `ARCHITECTURE.md §10`.
4. **Design-vision sprint** — the high-end playful/motion "mind-blown" redesign (separate future
   workstream). `DESIGN-VISION.md`. Launch on D first; redesign is a front-end-only swap.

## Files that matter (quick index)
- `docs/README.md` → orientation index
- `docs/ARCHITECTURE.md` → how the code is organised (read before touching code)
- `docs/DESIGN-VISION.md` → future design concept
- `apps/web/lib/copy.ts`, `lib/site.ts`, `lib/taxonomy.ts`, `lib/listing.ts` → single sources (copy/brand/categories/row-map)
- `apps/web/app/globals.css` → all design tokens
- `packages/core/src/brand.ts` → agent/server-facing name
- `supabase/migrations/*` → schema
- `scripts/seed.mjs` → seeds 31 dev rows
- Planning docs (product/decisions): `~/Hermes/apprank/apprank_idea/pm_wayfinder/{MVP,SPEC,MAP}.md`

## Do NOT
- Re-explain the product to the user — it's in the planning docs + this handoff.
- Touch another profile's files.
- Assume the idea-lifecycle web UI or any open item is decided — ask the user.
