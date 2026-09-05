import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import pg from "pg";
import { createStore } from "../src/index.js";

const { Pool } = pg;

const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgres://localhost:5432/apprank_test";

const validListing = {
  kind: "app",
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  author: "naumanmehdi",
};

const idea = {
  kind: "idea",
  name: "Habit tracker for shift workers",
  tagline: "An offline-first habit tracker built for night-shift routines",
  author: "idea_owner",
};

let pool: pg.Pool;
let store: ReturnType<typeof createStore>;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_URL });
  store = createStore(pool);
  // Idempotent schema bootstrap — safe to run every test session.
  await pool.query(`
    create extension if not exists pgcrypto;
    create table if not exists listings (
      id uuid primary key default gen_random_uuid(),
      kind text not null default 'app' check (kind in ('idea','app','mcp','skill')),
      name text not null, tagline text not null, description text,
      url text, repo_url text, category text, x_handle text,
      author text not null default 'anon', author_contact text,
      status text not null default 'live'
        check (status in ('pending','live','flagged','removed')),
      spotlighted boolean not null default false,
      claim_state text check (claim_state in ('claimed','in_progress','built','abandoned')),
      claimed_by text, claimed_at timestamptz, progress_note text, build_url text, built_at timestamptz,
      created_at timestamptz not null default now()
    );
    create table if not exists claim_log (
      id uuid primary key default gen_random_uuid(),
      idea_id uuid not null references listings(id) on delete cascade,
      actor text not null,
      action text not null check (action in ('claim','progress','built','abandon','release')),
      detail text, created_at timestamptz not null default now()
    );
  `);
});

beforeEach(async () => {
  await pool.query("truncate listings, claim_log");
});

afterAll(async () => {
  await pool.end();
});

describe("createStore.insertListing", () => {
  it("inserts a listing and returns it with id, live status and created_at", async () => {
    const row = await store.insertListing(validListing);
    expect(row).toMatchObject({ name: "AgentScribe", status: "live", kind: "app" });
    expect(row.id).toBeTruthy();
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it("inserts an idea with no url", async () => {
    const row = await store.insertListing(idea);
    expect(row.kind).toBe("idea");
    expect(row.url).toBeNull();
    expect(row.claim_state).toBeNull();
  });

  it("persists the row so getListing returns it", async () => {
    const { id } = await store.insertListing(validListing);
    const got = await store.getListing(id);
    expect(got?.url).toBe("https://agentscribe.dev");
    expect(got?.author).toBe("naumanmehdi");
  });
});

describe("createStore.getListing", () => {
  it("returns null for an unknown id", async () => {
    const got = await store.getListing("00000000-0000-0000-0000-000000000000");
    expect(got).toBeNull();
  });
});

describe("createStore.listLatest", () => {
  it("returns most-recently-created first", async () => {
    await store.insertListing({ ...validListing, name: "First" });
    await new Promise((r) => setTimeout(r, 5));
    await store.insertListing({ ...validListing, name: "Second" });

    const rows = await store.listLatest(10);
    expect(rows[0]?.name).toBe("Second");
    expect(rows[1]?.name).toBe("First");
  });

  it("only returns live listings", async () => {
    await store.insertListing({ ...validListing, name: "Visible" });
    const { id } = await store.insertListing({ ...validListing, name: "Hidden" });
    await pool.query("update listings set status = 'pending' where id = $1", [id]);

    const rows = await store.listLatest(10);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Visible");
  });

  it("filters by kind", async () => {
    await store.insertListing(idea);
    await store.insertListing(validListing);
    const rows = await store.listLatest({ kind: "idea" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("idea");
  });
});

describe("createStore.searchListings", () => {
  it("matches across name/tagline by substring", async () => {
    await store.insertListing(validListing); // "Turns meetings into notes"
    const rows = await store.searchListings({ query: "meetings" });
    expect(rows.some((r) => r.name === "AgentScribe")).toBe(true);
  });

  it("filters by kind", async () => {
    await store.insertListing(idea);
    await store.insertListing(validListing);
    const rows = await store.searchListings({ kind: "idea" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toContain("Habit");
  });

  it("claimableOnly returns only unbuilt, unclaimed ideas", async () => {
    await store.insertListing(idea); // unclaimed
    await store.insertListing({ ...idea, name: "Second idea" });
    await store.insertListing(validListing); // not an idea

    // claim the first idea
    const published = await store.listLatest({ kind: "idea" });
    await store.claimIdea(published[0]!.id, "builder1");

    const rows = await store.searchListings({ claimableOnly: true });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Habit tracker for shift workers");
  });
});

describe("createStore.claimIdea / updateClaim (lifecycle)", () => {
  it("claims an idea: sets claimed_by and appends a claim log", async () => {
    const { id } = await store.insertListing(idea);
    const res = await store.claimIdea(id, "builder1");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.listing.claim_state).toBe("claimed");
    expect(res.listing.claimed_by).toBe("builder1");
    const log = await store.listIdeaActivity(id);
    expect(log.map((l) => l.action)).toEqual(["claim"]);
    expect(log[0]!.actor).toBe("builder1");
  });

  it("rejects claiming a non-idea", async () => {
    const { id } = await store.insertListing(validListing);
    const res = await store.claimIdea(id, "builder1");
    expect(res.ok).toBe(false);
  });

  it("rejects claiming your own idea", async () => {
    const { id } = await store.insertListing({ ...idea, author: "builder1" });
    const res = await store.claimIdea(id, "builder1");
    expect(res.ok).toBe(false);
  });

  it("rejects double-claiming the same idea", async () => {
    const { id } = await store.insertListing(idea);
    await store.claimIdea(id, "builder1");
    const res = await store.claimIdea(id, "builder2");
    expect(res.ok).toBe(false);
  });

  it("enforces the active-claim cap", async () => {
    for (let i = 0; i < 3; i++) {
      const { id } = await store.insertListing({ ...idea, name: `Idea ${i}` });
      const r = await store.claimIdea(id, "builder1");
      expect(r.ok).toBe(true);
    }
    const fresh = await store.insertListing({ ...idea, name: "Fourth" });
    const res = await store.claimIdea(fresh.id, "builder1");
    expect(res.ok).toBe(false);
  });

  it("moves claimed -> in_progress with a progress note", async () => {
    const { id } = await store.insertListing(idea);
    await store.claimIdea(id, "builder1");
    const res = await store.updateClaim(id, "builder1", {
      state: "in_progress",
      progress_note: "scaffolded, repo at github.com/builder1/habit",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.listing.claim_state).toBe("in_progress");
    expect(res.listing.progress_note).toContain("github.com");
  });

  it("moves claimed -> built requiring a build_url, and logs it", async () => {
    const { id } = await store.insertListing(idea);
    await store.claimIdea(id, "builder1");

    const noUrl = await store.updateClaim(id, "builder1", { state: "built" });
    expect(noUrl.ok).toBe(false);

    const res = await store.updateClaim(id, "builder1", {
      state: "built",
      build_url: "https://habit.app",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.listing.claim_state).toBe("built");
    expect(res.listing.build_url).toBe("https://habit.app");
    expect(res.listing.built_at).toBeInstanceOf(Date);

    const log = await store.listIdeaActivity(id);
    expect(log.map((l) => l.action)).toEqual(["claim", "built"]);
  });

  it("only the claimer can update", async () => {
    const { id } = await store.insertListing(idea);
    await store.claimIdea(id, "builder1");
    const res = await store.updateClaim(id, "intruder", {
      state: "in_progress",
      progress_note: "nope",
    });
    expect(res.ok).toBe(false);
  });
});

describe("createStore.listMyIdeas", () => {
  it("returns ideas the actor owns or has claimed", async () => {
    const owned = await store.insertListing({ ...idea, name: "My idea", author: "me" });
    const { id: theirIdea } = await store.insertListing({
      ...idea,
      name: "Their idea",
      author: "other",
    });
    await store.claimIdea(theirIdea, "me");

    const mine = await store.listMyIdeas("me");
    expect(mine.map((l) => l.name).sort()).toEqual(["My idea", "Their idea"]);
    expect(owned.id).toBeTruthy();
  });
});
