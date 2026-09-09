# docket — Build Docs

**The one folder to read first.** If you're a human or an agent picking this project up fresh, start here.

## Quick orientation
- **If you're resuming a session / picking up mid-build:** read **`RESUME.md`** first — it's the live
  handoff (where it stands, what's open, how to run). Then `ARCHITECTURE.md`.
- **What it is:** a free, agent-native discovery catalog. One board across four kinds — **ideas, apps,
  MCP servers, agent skills** — published and found by humans *and* their AI agents. Publish an idea,
  or ask your agent to find you one to build.
- **Where it lives:** code repo at `~/Hermes/apprank/app`.

## Start with these, in order
1. **`RESUME.md`** — live handoff for resuming work.
2. **`ARCHITECTURE.md`** — how the code is organised, the client/server rule, and where to change
   branding/copy/categories. Read this before touching code.
3. **`PRODUCTION-CHECKLIST.md`** — production readiness checklist.
4. **`PER-IDENTITY-KEYS.md`** — per-identity MCP keys spec.

## Docs index
| File | What it's for |
|---|---|
| `RESUME.md` | **Live handoff** — current state, open items, how to run |
| `ARCHITECTURE.md` | Engineering orientation — layers, client/server rule, data model, flows, run steps |
| `PRODUCTION-CHECKLIST.md` | Production readiness checklist |
| `PER-IDENTITY-KEYS.md` | Per-identity MCP keys spec |
| `WORKSTREAMS.md` | Dedicated brief for branding, content, and case-study work |
| `DESIGN-VISION.md` | Future high-end playful/motion design concept (not built) |
| `CASE-STUDY.md` | Showable product story for Show-HN / portfolio |
| `ADMIN.md` | Admin key location + access |

## The key rule that makes this future-proof
**Front-end redesigns never touch the backend.** Data + logic live in `packages/core` + the server page;
the presentation lives in `apps/web/app/_components` + `globals.css` + `lib/copy.ts`. A redesign = swap
the presentation layer only. See `ARCHITECTURE.md`.

## If you're continuing this in another session / harness / by a new person
1. Read `ARCHITECTURE.md` (10 min).
2. Read `DESIGN-VISION.md` only if you're doing front-end work.
3. Check the current git state + run the app (steps in `ARCHITECTURE.md`) before changing anything.
