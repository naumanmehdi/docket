# WORKSTREAMS — branding · content · case study (run in a SEPARATE session)

This file briefs a fresh session to work on the **non-code** side of docket: branding, content,
and a case study. Read `docs/RESUME.md` + `docs/ARCHITECTURE.md` first for product context; this
file is the dedicated brief for creative/marketing work so it stays OUT of the build loop.

> All output should follow the existing brand voice and design taste (see "Constraints").

## Product in one line (for anyone new)
docket is an open, agent-first catalog where ideas, apps, MCPs, and skills are all findable in one
board — and an agent can publish or find any of them in a single sentence. Mind: "Ideas that get
built. An agent that does the paperwork."

## 1 · BRANDING
- **Brand assets already set** (do not re-decide): name `docket` (lowercase), domain `rundocket.xyz`,
  tagline voice = "Ideas that get built. An agent that does the paperwork." Single ember accent
  `#d9743f`, cream paper `#fbf7ef`, espresso ink `#26190f`, Fraunces serif + Plus Jakarta Sans.
- **Open branding tasks:**
  - Tagline/hero copy polish in `apps/web/lib/copy.ts` (single source) — refine the lede, the 4
    category descriptions, the "Everything/board" sub-lines. Keep warm, specific, no AI-isms
    (banned: "Elevate", "Seamless", "Next-Gen", cream/coral slop; no emoji-as-icons).
  - Website footer/nav copy (already structured in copy.ts — verify tone).
  - A favicon / og:image (docket-tab mark exists in CSS; no real asset yet). `app/apple-icon` or
    `/public` — currently missing (SECURITY/audit noted "missing favicon" as a gap).
  - llms.txt copy: it lists tools + board; keep it accurate (9 MCP tools now).
- **Deliverables:** edit copy.ts (and any assets) back on `redesign/soft-cream`; run the web build +
  tests before committing.

## 2 · CONTENT (board + docs)
- **Seed/the board** (`scripts/seed.mjs`, 31 rows): verify descriptions read well, are specific,
  non-generic, no Lorem. Improve any weak copy.
- **Docs**: `README.md`, `docs/README.md` — make onboarding crisp for a human or an agent reading
  the repo cold. `SECURITY.md` is up to date; `ARCHITECTURE.md` is the technical map.
- **Feedback copy** already set in copy.ts (private-note framing) — don't regress to "sends to index".
- **Deliverables:** edited `.md` + `seed.mjs` + `copy.ts`; no code/logic changes.

## 3 · CASE STUDY (docket as a showable product story)
Goal: a concise, honest written case study (markdown — `docs/CASE-STUDY.md`) that someone could
turn into a Show-HN post / portfolio piece / intro blurb.
- **Told from:** a builder who made an agent-first directory in a couple of sessions, zero infra cost.
- **To capture (ground truth from this repo):**
  - Why agent-native: a single `/mcp` the agent reads AND writes (publish + search + claim + feedback).
  - The 4-kind board (ideas/apps/MCPs/skills) — one open index, ideas first-class.
  - llms.txt as an open, agent-readable index + self-install manifest.
  - No monetization/email in v1; lifecycle (claimed→built) is intent + transparency, not exclusivity.
  - Stack & cost: Next.js + Supabase Postgres + free LLMs, one Vercel deploy. 75 tests.
  - Design: went from a generic dark-SaaS ("AI-slop") to a distinct soft-cream + binder-tab "docket"
    motif — name-metaphor design, single accent, editorial serif (taste-skill-informed).
  - Security posture: fail-closed auth, two-tier MCP keys, parameterized SQL, no-lock-in data.
- **Tone:** specific numbers over vibes; honest about deferrals + the one dependency-audit caveat
  (`npm audit` dev-only findings). No hype, no "revolutionary" cliches.
- **Deliverable:** `docs/CASE-STUDY.md` (new file), committed on `redesign/soft-cream`.

## Constraints (same taste rules as the build)
- Warm-dark ethos, but the shipped design is **light soft-cream** now — match THAT.
- No emoji as icons; Fraunces serif sparingly for display; specific human copy over generic value props.
- Keep everything on branch `redesign/soft-cream`; run `npm run build --workspace @docket/web` +
  `DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test` before committing if you touched code or copy.
- Never rename the DB/folder `apprank`; never commit secrets; never touch another profile's files.