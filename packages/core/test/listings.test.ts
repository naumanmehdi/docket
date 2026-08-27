import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import pg from "pg";
import { createStore } from "../src/index.js";

const { Pool } = pg;

const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgres://localhost:5432/apprank_test";

const validListing = {
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  category: "Productivity",
  x_handle: "agentscribe",
};

let pool: pg.Pool;
let store: ReturnType<typeof createStore>;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_URL });
  store = createStore(pool);
  // Ensure schema exists (idempotent — safe to run every test session).
  await pool.query(`
    create table if not exists listings (
      id uuid primary key default gen_random_uuid(),
      name text not null, tagline text not null, url text not null,
      category text not null, x_handle text,
      status text not null default 'live' check (status in ('pending','live','flagged')),
      created_at timestamptz not null default now()
    );
    create table if not exists subscribers (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      created_at timestamptz not null default now()
    );
  `);
});

beforeEach(async () => {
  await pool.query("truncate listings, subscribers");
});

afterAll(async () => {
  await pool.end();
});

describe("createStore.insertListing", () => {
  it("inserts a listing and returns it with id, live status and created_at", async () => {
    const row = await store.insertListing(validListing);
    expect(row).toMatchObject({ name: "AgentScribe", status: "live" });
    expect(row.id).toBeTruthy();
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it("persists the row so getListing returns it", async () => {
    const { id } = await store.insertListing(validListing);
    const got = await store.getListing(id);
    expect(got?.url).toBe("https://agentscribe.dev");
    expect(got?.category).toBe("Productivity");
  });

  it("stores a null x_handle when omitted", async () => {
    const { name, url, tagline, category } = validListing;
    const row = await store.insertListing({ name, url, tagline, category });
    expect(row.x_handle).toBeNull();
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
    // second gets a slightly later timestamp
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

  it("respects the limit", async () => {
    for (let i = 0; i < 5; i++) {
      await store.insertListing({ ...validListing, name: `Tool ${i}` });
    }
    const rows = await store.listLatest(3);
    expect(rows).toHaveLength(3);
  });
});

describe("createStore.insertSubscriber", () => {
  it("inserts a subscriber and returns id + email", async () => {
    const row = await store.insertSubscriber("builder@example.com");
    expect(row).toMatchObject({ email: "builder@example.com" });
    expect(row.id).toBeTruthy();
  });

  it("is idempotent for a duplicate email (no unique violation)", async () => {
    await store.insertSubscriber("dup@example.com");
    const second = await store.insertSubscriber("dup@example.com");
    expect(second.email).toBe("dup@example.com");

    const { rows } = await pool.query(
      "select count(*)::int as n from subscribers where email = $1",
      ["dup@example.com"]
    );
    expect(rows[0]?.n).toBe(1);
  });
});
