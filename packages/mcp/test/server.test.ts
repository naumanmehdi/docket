import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import pg from "pg";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createStore } from "@apprank/core";
import { createApprankServer } from "../src/server.js";

const { Pool } = pg;
const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgres://localhost:5432/apprank_test";

const valid = {
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  category: "Productivity",
  x_handle: "agentscribe",
};

let pool: pg.Pool;
let store: ReturnType<typeof createStore>;
let client: Client;
let closeServer: () => Promise<void>;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_URL });
  store = createStore(pool);
  await pool.query(`
    create table if not exists listings (
      id uuid primary key default gen_random_uuid(),
      name text not null, tagline text not null, url text not null,
      category text not null, x_handle text,
      status text not null default 'live' check (status in ('pending','live','flagged')),
      created_at timestamptz not null default now()
    );
  `);
});

beforeEach(async () => {
  await pool.query("truncate listings");
  const server = createApprankServer({ store });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  closeServer = () => client.close();
});

afterAll(async () => {
  await pool.end();
});

describe("MCP list_tool", () => {
  it("lists a tool and returns id + live status", async () => {
    const result = await client.callTool({
      name: "list_tool",
      arguments: valid,
    });
    const payload = JSON.parse(textOf(result));
    expect(payload).toMatchObject({ name: "AgentScribe", status: "live" });
    expect(payload.id).toBeTruthy();
  });

  it("rejects invalid input with an isError result", async () => {
    const result = await client.callTool({
      name: "list_tool",
      arguments: { ...valid, url: "not-a-url" },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("url");
  });

  it("writes the row so get_listing can read it back", async () => {
    const created = await client.callTool({ name: "list_tool", arguments: valid });
    const { id } = JSON.parse(textOf(created));

    const got = await client.callTool({
      name: "get_listing",
      arguments: { tool_id: id },
    });
    expect(JSON.parse(textOf(got))).toMatchObject({ name: "AgentScribe", url: "https://agentscribe.dev" });
  });
});

describe("MCP get_listing", () => {
  it("returns an error for an unknown id", async () => {
    const result = await client.callTool({
      name: "get_listing",
      arguments: { tool_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("MCP top-10 resource", () => {
  it("exposes the latest listings newest-first", async () => {
    await store.insertListing({ ...valid, name: "First" });
    await new Promise((r) => setTimeout(r, 5));
    await store.insertListing({ ...valid, name: "Second" });

    const res = await client.readResource({ uri: "apprank://listings/top-10" });
    const contents = res.contents?.[0] as { text?: string };
    const parsed = JSON.parse(contents.text ?? "[]");
    expect(parsed.map((x: { name: string }) => x.name)).toEqual(["Second", "First"]);
  });

  it("includes tools listed over MCP (same DB)", async () => {
    await client.callTool({ name: "list_tool", arguments: valid });
    const res = await client.readResource({ uri: "apprank://listings/top-10" });
    const contents = res.contents?.[0] as { text?: string };
    const parsed = JSON.parse(contents.text ?? "[]");
    expect(parsed.some((x: { name: string }) => x.name === "AgentScribe")).toBe(true);
  });
});

function textOf(result: { content?: Array<{ type: string; text?: string }> }): string {
  const t = result.content?.find((c) => c.type === "text")?.text ?? "";
  return t;
}
