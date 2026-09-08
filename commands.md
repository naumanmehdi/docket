# docket — quick commands

Copy-paste blocks for local work and deploy. Assumes macOS, nvm, Node 20, local Postgres.

---

## Setup (first time or after clone)

```bash
cd ~/Hermes/apprank/app
nvm use 20
npm install
createdb apprank 2>/dev/null; createdb apprank_test 2>/dev/null
psql -d apprank -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
```

---

## Run locally

```bash
# Terminal 1 — MCP server (port 3001)
DATABASE_URL=postgres://localhost:5432/apprank MCP_API_KEY=dev-key npm run start --workspace @docket/mcp

# Terminal 2 — Web app (port 3000)
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
```

Then open `http://localhost:3000`.

---

## Tests

```bash
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

---

## Build + deploy (production)

```bash
cd ~/Hermes/apprank/app
nvm use 20
vercel --prod
```

Live at `https://rundocket.xyz`.

---

## Git (standard workflow)

```bash
git status
git add <files>
git commit -m "msg"
git push origin main
```

Branch is `main`. Don't rename DB/folder `apprank`.

---

## Don't commit

- `.env*` files (secrets)
- `docs/CASE-STUDY.md` (local/private)
- `docs/WORKSTREAMS.md` (local/private)
- `docs/DESIGN-VISION.md` (local/private)
- `content/*.md` (local/private)
