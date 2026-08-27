-- AppRank (working title) — plain Postgres, portable to Supabase as-is.
-- Migration 0001: listings + subscribers.

create extension if not exists pgcrypto;

create table if not exists listings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  tagline    text not null,
  url        text not null,
  category   text not null,
  x_handle   text,
  status     text not null default 'live'
             check (status in ('pending','live','flagged')),
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_status_idx on listings (status);

create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);
