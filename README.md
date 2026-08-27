# AppRank — the directory your agent can use (working title)

An AI-tool directory where a builder — **or their AI agent** — lists a tool for free in ~2 minutes,
with a live "latest listings" board that fills itself, plus the start of the content + outreach flywheel.
The differentiator is the **agent-native launch MCP server**: your agent can list you.

> **Brand is TBD.** The working name is `AppRank`. Every reference lives in ONE file:
> `packages/core/src/brand.ts`. Do not hardcode a final name anywhere else (MVP §6).

## The wedge (MVP scope — shipped)
1. Free listing via **MCP server** (the differentiator) — `list_tool`
2. Free listing via **web form** (fallback) — `POST /api/listings`
3. **Live "latest listings" board** — reads the SAME Postgres the MCP writes to (real density)
4. **Email capture** (launch cohort) — `POST /api/subscribe`
5. Manual daily Top-3 post + seed DMs (templates in `content/`)
6. MCP server registered in a registry

## Repo layout (monorepo, npm workspaces)
```
packages/core/   validation + Postgres data-access layer (the shared source of truth)
packages/mcp/    the MCP server (list_tool, get_listing, top-10 resource, API-key auth)
apps/web/        Next.js landing page (App Router + TS)
supabase/migrations/  0001_create_listings.sql  (plain Postgres, portable to Supabase)
content/         Top-3 post template, seed-DM template, MCP registry listing, Show HN draft
```

## Quickstart (local)
Requires Node ≥ 20 (`nvm install 20`) and Postgres running locally.

```bash
npm install

# 1. Create the databases + apply the migration
createdb apprank; createdb apprank_test
psql -d apprank -f supabase/migrations/0001_create_listings.sql

# 2. Run all tests (core + mcp) against the test DB
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test

# 3. Seed the dev board with a few sample listings
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs

# 4a. MCP server (HTTP, streamable) on :3001
DATABASE_URL=postgres://localhost:5432/apprank MCP_API_KEY=dev-key \
  npm run start --workspace @apprank/mcp

# 4b. Web app on :3000
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @apprank/web
```

Try the MCP server end-to-end (SDK client, real HTTP):
```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const c = new Client({ name: "x", version: "1" });
await c.connect(new StreamableHTTPClientTransport(new URL("http://localhost:3001/mcp"),
  { requestInit: { headers: { Authorization: "Bearer dev-key" } } }));
await c.callTool({ name: "list_tool", arguments: { name: "MyTool", url: "https://x.dev",
  tagline: "one line", category: "Coding" } });
```

## API
| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/listings` | POST | `{name,url,tagline,category,x_handle?}` | `201 {ok,listing}` / `400 {ok:false,errors}` |
| `/api/subscribe` | POST | `{email}` | `201 {ok,subscriber}` / `400 {ok:false,errors}` |
| `/mcp` (server) | POST | MCP JSON-RPC | 401 unless `Authorization: Bearer <MCP_API_KEY>` |

## Deploy (Vercel + Supabase)
1. **Create a Supabase project**, run `supabase/migrations/0001_create_listings.sql` in the SQL editor.
   Copy the DB connection string → `DATABASE_URL`.
2. **Deploy the web app** to Vercel (or Cloudflare). Connect the repo; set `DATABASE_URL` env var.
3. **Deploy the MCP server** — same repo, `packages/mcp` (works on Vercel/Cloudflare as a serverless
   function, or `node dist/index.js` on any VM). Set `DATABASE_URL` + `MCP_API_KEY`. Route `/mcp`.
4. **Register the MCP server** in a registry (mcp.so etc.) — paste `content/mcp-registry-listing.md`.
5. Buy the final domain, swap the name in `packages/core/src/brand.ts`, redeploy.

> Payments are intentionally **absent** (Pakistan). When added, they go behind a thin `billing`
> layer (Whop primary / LemonSqueezy backup) so swapping Stripe later is a config change.

## Security notes (MVP)
- MCP server is **fail-closed**: no `MCP_API_KEY` set ⇒ every request is `401`. Bearer tokens are
  compared in constant time (`crypto.timingSafeEqual`).
- Input validation is the single source of truth in `packages/core` (shared by web + MCP) — limits on
  name/tagline/category length, strict URL + email validation.
- No secrets in the repo; all via env. `.gitignore` excludes `.env*`. Seed data is fake.
- No destructive MCP tools, no rate-limit bypass, no shell execution.

## Definition of "launched" (tracking)
- [ ] Live domain serving the landing page (blocked: brand + domain TBD)
- [x] MCP server responding + (registry listing drafted — register when deployed)
- [x] ≥1 listing in the DB
- [x] Email capture working
- [ ] First Top-3 post live on X (template ready)
- [ ] Build story drafted (Show HN — `content/show-hn-draft.md`, post after launch)

## Status
Layers 0–3 built and verified locally (TDD: 27 core + 21 mcp tests green; MCP-over-HTTP E2E green;
web form + live board browser-tested). Layers 4–5 templates + CI + docs written. Remaining to actually
*launch*: brand/domain, Supabase/Vercel/GitHub accounts, an X handle — all need the user.
