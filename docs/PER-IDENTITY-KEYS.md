# Per-Identity MCP Keys

## Current State (Sep 2026)
- Invite-code-gated registration
- Per-identity MCP keys (sha256 hash stored, plaintext shown once)
- Scopes: read, write, admin
- Tables: invite_codes, mcp_keys, mcp_rate_limits

## Registration Flow
1. Admin creates invite code at /admin
2. User registers at /register with code + email/handle
3. System issues per-identity key (dk_ prefix)
4. Key shown once, never stored in plaintext

## Auth Precedence
1. MCP_ADMIN_KEY → read+write+admin
2. MCP_API_KEY → read+write
3. DB-issued key → scopes from invite code

## Rate Limits
- Register: 5/hour/IP
- MCP: 100/hour/key (read), 20/hour (write), 10/hour (admin)
- Master keys skip rate limits

## Owner Verification
None at launch. Invite code IS the trust signal.

## Future Fixes
1. Owner verification (email magic link or OAuth)
2. Admin email alerts
3. Rate-limit dashboard
