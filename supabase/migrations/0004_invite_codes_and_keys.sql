-- docket (ex-AppRank) — plain Postgres, portable to Supabase as-is.
-- Migration 0004: invite-code-gated, per-identity MCP keys.
--  - `invite_codes`: the owner's self-serve gate. Each code caps how many keys
--    may be minted from it (max_uses), can expire, and can be revoked as a batch.
--    Codes are created only by the owner (admin endpoints / direct SQL).
--  - `mcp_keys`: one row per issued API key. Only a one-way HASH of the key is
--    stored (sha256 hex); the plaintext secret is shown exactly once at issue.
--    scopes is a text[] of read/write/admin. owner is the registrant's email or
--    handle. invite_code_id links the key to the code that minted it (audit +
--    batch revoke). revoked flips to true to kill a key without deleting it.
--  - `mcp_rate_limits`: a cheap per-key hourly counter so one leaked/misused key
--    can't hammer the MCP endpoint. window_start is truncated to the hour.
--    Cleanup: `delete from mcp_rate_limits where window_start < now() - interval '30 days'`.

create table if not exists invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  max_uses    int  not null check (max_uses >= 1),
  used_count  int  not null default 0 check (used_count >= 0),
  scopes      text[] not null default '{read,write}',
  expires_at  timestamptz,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists invite_codes_revoked_idx on invite_codes (revoked);

create table if not exists mcp_keys (
  id             uuid primary key default gen_random_uuid(),
  key_hash       text not null unique,
  owner          text not null,
  scopes         text[] not null default '{read,write}',
  invite_code_id uuid references invite_codes(id) on delete set null,
  last_used_at   timestamptz,
  revoked        boolean not null default false,
  created_at     timestamptz not null default now()
);
-- Lookup on every authenticated request is by sha256(token) — index it.
create index if not exists mcp_keys_key_hash_idx on mcp_keys (key_hash);
-- One ACTIVE key per owner (re-registering after a revoke is fine; the partial
-- index only guards rows where revoked = false).
create unique index if not exists mcp_keys_active_owner_uniq
  on mcp_keys (lower(owner)) where revoked = false;
create index if not exists mcp_keys_invite_code_idx on mcp_keys (invite_code_id);

create table if not exists mcp_rate_limits (
  id           uuid primary key default gen_random_uuid(),
  key_id       uuid not null references mcp_keys(id) on delete cascade,
  window_start timestamptz not null,
  requests     int  not null default 0,
  unique (key_id, window_start)
);
create index if not exists mcp_rate_limits_key_window_idx
  on mcp_rate_limits (key_id, window_start);
