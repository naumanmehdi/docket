# docket — new session handoff

Start here: `docs/RESUME.md`  
Admin key: `docs/ADMIN.md`

## Start command
```bash
cd ~/Hermes/apprank/app && nvm use 20 && git checkout main && git pull origin main
```

## Local dev
```bash
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
```

## Tests
```bash
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

## Staging deploy
```bash
cd ~/Hermes/apprank/app && nvm use 20 && vercel
```

## Production deploy (only after explicit approval)
```bash
cd ~/Hermes/apprank/app && nvm use 20 && vercel --prod
```

## Current state
- `/mcp-docs` and `/register` are live in code
- Favicon + “MCP” wording done
- Admin back-office committed
- Per-identity MCP keys + invite codes implemented
- Staging/production deploy not done yet

## What to do next
1. Read `docs/RESUME.md`
2. Deploy to staging, get user approval
3. Admin E2E verification
4. Rate-limiting + usage logging (see `docs/PER-IDENTITY-KEYS.md`)

## Rules
- Don’t rename DB `apprank`
- Don’t commit secrets
- Don’t deploy to production unless explicitly approved
