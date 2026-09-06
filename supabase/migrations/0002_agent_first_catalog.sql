-- docket (ex-AppRank) — plain Postgres, portable to Supabase as-is.
-- Migration 0002: NEW agent-first catalog vision (SPEC §6, MAP D14).
--  - listings: add kind/author/description/repo_url/spotlighted + idea-lifecycle columns,
--    relax url & category to optional (ideas have neither).
--  - new claim_log table (idea-lifecycle public timeline).
--  - drop subscribers (email capture is out of scope — D6).

-- The table is empty pre-release; ALTER is safe. Idempotency handled per-statement
-- so re-runs don't fail.

-- 1. New columns on listings.
alter table listings
  add column if not exists kind         text not null default 'app'
    check (kind in ('idea','app','mcp','skill')),
  add column if not exists description  text,
  add column if not exists repo_url     text,
  add column if not exists author       text,
  add column if not exists author_contact text,
  add column if not exists spotlighted  boolean not null default false;

-- 2. Relax NOT NULL: url & category now optional (an idea is an unbuilt thought).
alter table listings
  alter column url      drop not null,
  alter column category drop not null;

-- 3. Idea-lifecycle columns (D14).
alter table listings
  add column if not exists claim_state  text
    check (claim_state in ('claimed','in_progress','built','abandoned')),
  add column if not exists claimed_by   text,
  add column if not exists claimed_at   timestamptz,
  add column if not exists progress_note text,
  add column if not exists build_url    text,
  add column if not exists built_at     timestamptz;

-- 4. Widen status to include 'removed' (report/unpublish path, D7). Existing check
--    is ('pending','live','flagged'); widen to also allow 'removed'.
alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check
  check (status in ('pending','live','flagged','removed'));

-- 5. Indexes for the board + search.
create index if not exists listings_kind_status_idx
  on listings (kind, status);
create index if not exists listings_claim_state_idx
  on listings (claim_state) where claim_state is not null;

-- 6. claim_log — append-only public timeline per idea (recorder, not judge).
create table if not exists claim_log (
  id         uuid primary key default gen_random_uuid(),
  idea_id    uuid not null references listings(id) on delete cascade,
  actor      text not null,
  action     text not null
             check (action in ('claim','progress','built','abandon','release')),
  detail     text,
  created_at timestamptz not null default now()
);
create index if not exists claim_log_idea_id_idx on claim_log (idea_id, created_at);

-- 7. Drop subscribers (email capture is out of the new scope).
drop table if exists subscribers;
