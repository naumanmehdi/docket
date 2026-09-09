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

## Current state (verified Sep 9, 2026)
- **Production deploy IS DONE** — site live at https://rundocket.xyz (31 items on board)
- `/`, `/mcp-docs`, `/register`, `/admin`, `/mcp`, `/llms.txt` all live
- Soft-cream editorial + binder-tab design live
- Per-identity MCP keys + invite codes live
- XSS protection verified (stripHtml in validation)
- Admin back-office live

## What to do next
1. Read `docs/RESUME.md` and `docs/PRODUCTION-CHECKLIST.md`
2. Verify production checklist items (rate limits, test data cleanup, key rotation per-env)
3. Admin E2E verification on production
4. Monitor error logs

## Rules
- Don’t rename DB `apprank`
- Don’t commit secrets
- Don’t deploy to production unless explicitly approved
