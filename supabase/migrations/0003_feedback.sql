-- docket (ex-AppRank) — plain Postgres, portable to Supabase as-is.
-- Migration 0003: private feedback intake + top-asks digest.
--  - new `feedback` table: a PRIVATE back-office inbox, deliberately SEPARATE
--    from the public `listings` catalog. Mailing feedback into `listings` would
--    bloat the discoverable board and bury real ideas — so it lives in its own
--    table that no public board/search ever reads. Only the owner (via admin
--    key, or direct SQL) sees it.
--  - new `feedback_top_asks` view: groups raw feedback into "top asks" with
--    counts + recency, so N raw notes collapse into the few real decisions.
--    Readable with a plain `select * from feedback_top_asks;` — agent-free.

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  message     text not null check (length(message) between 1 and 4000),
  kind        text not null default 'general'
              check (kind in ('general','idea','app','mcp','skill')),
  contact     text,
  status      text not null default 'new'
              check (status in ('new','acknowledged','triage','shipped','wontdo','spam')),
  source      text not null default 'web'
              check (source in ('web','mcp')),
  created_at  timestamptz not null default now()
);
create index if not exists feedback_created_idx   on feedback (created_at desc);
create index if not exists feedback_status_idx    on feedback (status);
create index if not exists feedback_kind_idx      on feedback (kind);

-- Top-asks digest. Groups feedback by a normalized marker: kind + a
-- lowercased first ~28 chars of the message (a cheap, deterministic proxy for
-- "similar request" — no ML needed at launch scale). Shows share of voice so
-- the owner sees what to build next, with the most recent ask in each group.
create or replace view feedback_top_asks as
  select
    kind,
    left(lower(full_message), 28) as bucket,
    count(*)::int as votes,
    max(created_at) as last_at,
    -- the representative (longest, newest) message in the group
    (array_agg(message order by length(message) desc, created_at desc))[1] as sample
  from (
    select message, kind, created_at, message as full_message from feedback
    where status <> 'spam'
  ) _f
  group by kind, left(lower(_f.full_message), 28)
  order by votes desc, last_at desc;