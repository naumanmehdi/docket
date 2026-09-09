# docket — Production Readiness Checklist

## Pre-deploy
- [ ] All test data cleaned from DB
- [ ] Admin keys rotated (Production key ≠ Preview key ≠ Dev key)
- [ ] DATABASE_URL set for Production
- [ ] MCP_ADMIN_KEY set for Production
- [ ] MCP_API_KEY set for Production
- [ ] Old Vercel preview deployments removed
- [ ] No console.log/error in production code
- [ ] No test-only files in repo
- [ ] XSS protection verified
- [ ] SQL injection protection verified
- [ ] Rate limiting configured
- [ ] Scope enforcement verified

## Deploy
- [ ] Deploy to staging
- [ ] Verify all routes (/, /mcp-docs, /register, /admin, /llms.txt, /mcp)
- [ ] Verify MCP endpoint with tools/list
- [ ] Verify admin endpoint with admin key
- [ ] Verify register flow end-to-end
- [ ] Promote to production

## Post-deploy
- [ ] Verify production URL (rundocket.xyz)
- [ ] Verify MCP endpoint on production
- [ ] Verify admin on production
- [ ] Verify /llms.txt on production
- [ ] Create first real invite code
- [ ] Issue first real MCP key
- [ ] Monitor error logs for 24h

## Security
- [ ] XSS: HTML stripped in listing validation
- [ ] SQLi: Parameterized queries
- [ ] Auth: Bearer token required
- [ ] Scopes: Admin tools gated
- [ ] Rate limits: 5/hr/IP register, 100/hr/key MCP
- [ ] Invite codes: Required for registration
- [ ] No secrets in repo

## Rollback plan
- If production breaks: vercel rollback
- If DB issue: restore from Supabase backup
- If key leak: rotate MCP_ADMIN_KEY + MCP_API_KEY in Vercel
