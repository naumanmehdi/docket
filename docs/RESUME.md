# RESUME — docket handoff

Live at **https://rundocket.xyz**. Branch **main**, pushed to GitHub (`naumanmehdi/docket`).

## Current version: v0.2.0 (2026-09-15)

Previous: v0.1.0 (2026-09-06) — initial release.

See **[docs/CHANGELOG.md](CHANGELOG.md)** for full history.

## Stack
- Next.js + TS + Supabase Postgres + Vercel
- npm scope `@docket/*`
- Tests: core 61, mcp 35 (green, CI passing)
- DB: `apprank` (local + prod; don't rename)

## Secrets
- `DATABASE_URL`, `MCP_API_KEY`, `MCP_ADMIN_KEY` (Vercel envs, all Secret type)
- Admin key doc: `docs/ADMIN.md`
- Never commit secrets

## What ships (v0.2.0)

### Pages
| Page | Purpose |
|------|---------|
| `/` | Soft-cream editorial board, binder-tab motif, publish modal, feedback form |
| `/mcp-docs` | 3-step agent setup guide + "test my connection" button |
| `/register` | Invite-code signup → per-identity MCP key + post-key config snippet |
| `/key-dashboard` | Key management — view, revoke, regenerate keys |
| `/my-activity` | My listings + my feedback |
| `/admin` | Owner back-office (codes/keys/revoke) |

### API endpoints
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/mcp` | GET | None | Capability discovery (tool list, auth info, rate limits, setup docs) |
| `/mcp` | POST | Bearer | MCP server (9 tools) |
| `/api/listings` | GET | None | Public read |
| `/api/listings` | POST | None | Publish (rate-limited) |
| `/api/feedback` | POST | None | Private feedback intake |
| `/api/mcp-keys/register` | POST | Invite code | Issue per-identity key |
| `/api/keys/manage` | GET | Bearer | List keys for owner |
| `/api/keys/revoke` | POST | Bearer | Revoke a key |
| `/api/keys/regenerate` | POST | Bearer | Regenerate a key (old one revoked) |
| `/api/my-listings` | GET | Bearer | Listings by authenticated author |
| `/api/my-feedback` | GET | Bearer | Feedback by authenticated contact |
| `/api/admin/invite-codes` | POST | Admin | Create invite codes |
| `/api/admin/mcp-keys` | GET | Admin | List all keys |
| `/api/admin/mcp-keys/revoke` | POST | Admin | Revoke any key |
| `/api/admin/invite-codes/revoke` | POST | Admin | Revoke invite code |

### MCP tools (9)
`publish`, `search`, `get_listing`, `claim_idea`, `update_claim`, `my_ideas`, `list_idea_activity`, `feedback`, `top_feedback`

Registered as `mcp__docket__*` (double underscore).

## Local setup
```bash
cd ~/Hermes/apprank/app
npm install
createdb apprank 2>/dev/null; createdb apprank_test 2>/dev/null
psql -d apprank -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql -f supabase/migrations/0004_invite_codes_and_keys.sql
psql -d apprank_test -f supabase/migrations/0001_create_listings.sql -f supabase/migrations/0002_agent_first_catalog.sql -f supabase/migrations/0003_feedback.sql -f supabase/migrations/0004_invite_codes_and_keys.sql
DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
DATABASE_URL=postgres://localhost:5432/apprank npm run dev --workspace @docket/web
# → http://localhost:3000
```

## Tests
```bash
DATABASE_URL_TEST=postgres://localhost:5432/apprank_test npm test
```

## Deploy
```bash
cd ~/Hermes/apprank/app
vercel deploy --prod
```

## File map (v0.2.0)

### Core business logic
| File | What |
|------|------|
| `packages/core/src/listings.ts` | Store: insert, search, claim, listMyListings, listMyFeedback |
| `packages/core/src/access.ts` | AccessStore: invite codes, keys, rate limits, listKeysForOwner, revokeUserKey, regenerateUserKey |
| `packages/core/src/validate.ts` | Centralized validation (XSS-safe) |
| `packages/mcp/src/server.ts` | 9 MCP tools |
| `packages/mcp/src/auth.ts` | resolveAuth, bearerToken, scope gating |

### Web app
| File | What |
|------|------|
| `apps/web/app/page.tsx` | Landing page |
| `apps/web/app/_components/Landing.tsx` | Header, hero, nav, register panel |
| `apps/web/app/register/page.tsx` | Invite-code signup |
| `apps/web/app/mcp-docs/page.tsx` | 3-step setup + test button |
| `apps/web/app/key-dashboard/page.tsx` | Key management UI |
| `apps/web/app/my-activity/page.tsx` | My listings + feedback |
| `apps/web/app/admin/page.tsx` | Admin back-office |
| `apps/web/lib/copy.ts` | All user-facing copy |
| `apps/web/app/globals.css` | Design tokens |

### API routes
| File | What |
|------|------|
| `apps/web/app/api/mcp/route.ts` | MCP endpoint + capability query + rate limit headers |
| `apps/web/app/api/mcp-keys/register/route.ts` | Register API |
| `apps/web/app/api/keys/manage/route.ts` | List keys |
| `apps/web/app/api/keys/revoke/route.ts` | Revoke key |
| `apps/web/app/api/keys/regenerate/route.ts` | Regenerate key |
| `apps/web/app/api/my-listings/route.ts` | Listings by author |
| `apps/web/app/api/my-feedback/route.ts` | Feedback by contact |
| `apps/web/app/api/admin/invite-codes/route.ts` | Admin: invite codes |
| `apps/web/app/api/admin/mcp-keys/route.ts` | Admin: list keys |
| `apps/web/app/api/admin/mcp-keys/revoke/route.ts` | Admin: revoke key |
| `apps/web/app/api/admin/invite-codes/revoke/route.ts` | Admin: revoke invite |

### Docs
| File | What |
|------|------|
| `README.md` | ELI5 project overview |
| `docs/README.md` | Orientation index |
| `docs/ARCHITECTURE.md` | Engineering orientation |
| `docs/CHANGELOG.md` | Full version history (v0.1.0 → v0.2.0) |
| `docs/RELEASE-v0.2.0.md` | LinkedIn-ready release summary |
| `docs/ROADMAP.md` | v1.1 and v2 plans |
| `docs/RESUME.md` | This file — live handoff |
| `docs/ADMIN.md` | Admin key location + access |
| `docs/PER-IDENTITY-KEYS.md` | Key system spec |
| `SECURITY.md` | Security model |

## Don't
- Re-explain the product (see README.md)
- Rename DB/folder `apprank`
- Touch another profile's files
- Commit secrets / `CASE-STUDY.md` / private docs
- Deploy to prod without explicit user approval

## Open items
- Cloudflare Turnstile integration (domain registered, pending verification code)
- Self-serve key generation (depends on Turnstile)
- Agent registration API (depends on self-serve)
- Onboarding wizard
- Activity dashboard
