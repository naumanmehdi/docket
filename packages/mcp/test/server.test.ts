import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import pg from "pg";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createStore } from "@docket/core";
import { createDocketServer } from "../src/server.js";

const { Pool } = pg;
const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgres://localhost:5432/apprank_test";

const app = {
  kind: "app",
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  author: "naumanmehdi",
};

const idea = {
  kind: "idea",
  name: "Shift-worker habit tracker",
  tagline: "An offline-first habit tracker built for night-shift routines",
  author: "owner_a",
};

let pool: pg.Pool;
let store: ReturnType<typeof createStore>;
let client: Client;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_URL });
  store = createStore(pool);
  await pool.query(`
    create extension if not exists pgcrypto;
    create table if not exists listings (
      id uuid primary key default gen_random_uuid(),
      kind text not null default 'app' check (kind in ('idea','app','mcp','skill')),
      name text not null, tagline text not null, description text,
      url text, repo_url text, category text, x_handle text,
      author text not null default 'anon', author_contact text,
      status text not null default 'live' check (status in ('pending','live','flagged','removed')),
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
  const server = createDocketServer({ store });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
});

afterAll(async () => {
  await pool.end();
});

describe("MCP publish", () => {
  it("publishes an app and returns id + live status", async () => {
    const result = await client.callTool({ name: "publish", arguments: app });
    const payload = JSON.parse(textOf(result));
    expect(payload).toMatchObject({ name: "AgentScribe", kind: "app", status: "live" });
    expect(payload.id).toBeTruthy();
  });

  it("publishes an idea with no url", async () => {
    const result = await client.callTool({ name: "publish", arguments: idea });
    const payload = JSON.parse(textOf(result));
    expect(payload).toMatchObject({ kind: "idea", claim_state: null });
  });

  it("rejects invalid input with an isError result", async () => {
    const result = await client.callTool({
      name: "publish",
      arguments: { ...app, url: "not-a-url" },
    });
    expect(result.isError).toBe(true);
  });

  it("rejects a built kind with no url", async () => {
    const result = await client.callTool({
      name: "publish",
      arguments: { ...app, url: "" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("MCP get_listing", () => {
  it("reads back a published listing", async () => {
    const created = await client.callTool({ name: "publish", arguments: app });
    const { id } = JSON.parse(textOf(created));
    const got = await client.callTool({ name: "get_listing", arguments: { id } });
    expect(JSON.parse(textOf(got))).toMatchObject({ name: "AgentScribe", url: "https://agentscribe.dev" });
  });

  it("returns an error for an unknown id", async () => {
    const result = await client.callTool({
      name: "get_listing",
      arguments: { id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("MCP search", () => {
  it("finds across kinds by text", async () => {
    await client.callTool({ name: "publish", arguments: app });
    const result = await client.callTool({ name: "search", arguments: { query: "meetings" } });
    const rows = JSON.parse(textOf(result));
    expect(rows.some((r: { name: string }) => r.name === "AgentScribe")).toBe(true);
  });

  it("filters by kind", async () => {
    await client.callTool({ name: "publish", arguments: app });
    await client.callTool({ name: "publish", arguments: idea });
    const result = await client.callTool({ name: "search", arguments: { kind: "idea" } });
    const rows = JSON.parse(textOf(result));
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("idea");
  });
});

describe("MCP idea lifecycle", () => {
  it("claims, progresses and builds an idea over MCP, owner checks via my_ideas", async () => {
    const pub = await client.callTool({ name: "publish", arguments: idea });
    const { id } = JSON.parse(textOf(pub));

    const claim = await client.callTool({
      name: "claim_idea",
      arguments: { idea_id: id, author: "builder_x" },
    });
    expect(JSON.parse(textOf(claim))).toMatchObject({ ok: true });
    expect(JSON.parse(textOf(claim)).listing.claim_state).toBe("claimed");

    const prog = await client.callTool({
      name: "update_claim",
      arguments: { idea_id: id, author: "builder_x", state: "in_progress", progress_note: "repo ready" },
    });
    expect(JSON.parse(textOf(prog)).listing.claim_state).toBe("in_progress");

    const built = await client.callTool({
      name: "update_claim",
      arguments: { idea_id: id, author: "builder_x", state: "built", build_url: "https://habit.app" },
    });
    const builtPayload = JSON.parse(textOf(built));
    expect(builtPayload.listing.claim_state).toBe("built");
    expect(builtPayload.listing.build_url).toBe("https://habit.app");

    // owner pull-notification
    const mine = await client.callTool({ name: "my_ideas", arguments: { author: "owner_a" } });
    const mineRows = JSON.parse(textOf(mine));
    const mineIdea = mineRows.find((r: { id: string }) => r.id === id);
    expect(mineIdea.claim_state).toBe("built");
    expect(mineIdea.claimed_by).toBe("builder_x");

    const activity = await client.callTool({ name: "list_idea_activity", arguments: { id } });
    const log = JSON.parse(textOf(activity));
    expect(log.map((l: { action: string }) => l.action)).toEqual(["claim", "progress", "built"]);
  });

  it("rejects a non-builder updating a claim", async () => {
    const pub = await client.callTool({ name: "publish", arguments: idea });
    const { id } = JSON.parse(textOf(pub));
    await client.callTool({ name: "claim_idea", arguments: { idea_id: id, author: "builder_x" } });
    const bad = await client.callTool({
      name: "update_claim",
      arguments: { idea_id: id, author: "intruder", state: "built", build_url: "https://x.dev" },
    });
    expect(bad.isError).toBe(true);
  });

  it("rejects claiming your own idea", async () => {
    const pub = await client.callTool({ name: "publish", arguments: idea });
    const { id } = JSON.parse(textOf(pub));
    const claim = await client.callTool({
      name: "claim_idea",
      arguments: { idea_id: id, author: "owner_a" },
    });
    expect(claim.isError).toBe(true);
  });
});

function textOf(result: { content?: Array<{ type: string; text?: string }> }): string {
  return result.content?.find((c) => c.type === "text")?.text ?? "";
}
