# docket — Build Docs

**The one folder to read first.** If you're a human or an agent picking this project up fresh, start here.

## Quick orientation
- **If you're resuming a session / picking up mid-build:** read **`RESUME.md`** first — it's the live
  handoff (where it stands, what's open, how to run). Then `ARCHITECTURE.md`.
- **What it is:** a free, agent-native discovery catalog. One board across four kinds — **ideas, apps,
  MCP servers, agent skills** — published and found by humans *and* their AI agents. Publish an idea,
  or ask your agent to find you one to build. See `apprank_idea/pm_wayfinder/SPEC.md` for the product.
- **Where it lives:** code repo at `~/Hermes/apprank/app`; planning/idea docs at
  `~/Hermes/apprank/apprank_idea/pm_wayfinder/`.

## Start with these, in order
1. **`RESUME.md`** — live handoff for resuming work.
2. **`ARCHITECTURE.md`** — how the code is organised, the client/server rule, and where to change
   branding/copy/categories. Read this before touching code.
3. **`DESIGN-VISION.md`** — the *end-goal* high-end, playful, motion-rich design ambition. The current
   live design is a clean warm-dark base (design variant D); this is where the future "wow" concept lives.
4. Repo root `README.md` + `SECURITY.md` for run/security details; `apprank_idea/pm_wayfinder/MAP.md`
   (decisions), `MVP.md` (build doc), `SPEC.md` (product).

## Docs index
| File | What it's for |
|---|---|
| `RESUME.md` | **Live handoff** — current state, open items, how to run |
| `ARCHITECTURE.md` | Engineering orientation — layers, client/server rule, single-source copy/brand/taxonomy, data model, flows, run steps |
| `DESIGN-VISION.md` | The future high-end playful/motion design concept (not built) |
| `WORKSTREAMS.md` | Dedicated brief for branding, content, and case-study work |
| *(repo)* `README.md` | Repo quickstart (now points here) |
| *(repo)* `SECURITY.md` | Security posture |
| *(repo)* `CASE-STUDY.md` | Showable product story for Show-HN / portfolio |

## The key rule that makes this future-proof
**Front-end redesigns never touch the backend.** Data + logic live in `packages/core` + the server page;
the presentation lives in `apps/web/app/_components` + `globals.css` + `lib/copy.ts`. A redesign = swap
the presentation layer only. See `ARCHITECTURE.md §2–3`.

## If you're continuing this in another session / harness / by a new person
1. Read `ARCHITECTURE.md` (10 min).
2. Read `DESIGN-VISION.md` only if you're doing front-end work.
3. Check the current git state + run the app (steps in `ARCHITECTURE.md §8`) before changing anything.
4. Don't re-derive decisions — they're logged in `apprank_idea/pm_wayfinder/MAP.md`.
