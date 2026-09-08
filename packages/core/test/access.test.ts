import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import pg from "pg";
import {
  createAccessStore,
  hashKeySecret,
  REGISTER_SCOPES,
} from "../src/index.js";

const { Pool } = pg;

const TEST_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgres://localhost:5432/apprank_test";

let pool: pg.Pool;
let access: ReturnType<typeof createAccessStore>;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_URL });
  access = createAccessStore(pool);
  // Idempotent schema bootstrap matching migration 0004.
  await pool.query(`
    create extension if not exists pgcrypto;
    create table if not exists invite_codes (
      id uuid primary key default gen_random_uuid(),
      code text not null unique,
      max_uses int not null check (max_uses >= 1),
      used_count int not null default 0 check (used_count >= 0),
      scopes text[] not null default '{read,write}',
      expires_at timestamptz,
      revoked boolean not null default false,
      created_at timestamptz not null default now()
    );
    create table if not exists mcp_keys (
      id uuid primary key default gen_random_uuid(),
      key_hash text not null unique,
      owner text not null,
      scopes text[] not null default '{read,write}',
      invite_code_id uuid references invite_codes(id) on delete set null,
      last_used_at timestamptz,
      revoked boolean not null default false,
      created_at timestamptz not null default now()
    );
    create unique index if not exists mcp_keys_active_owner_uniq
      on mcp_keys (lower(owner)) where revoked = false;
    create table if not exists mcp_rate_limits (
      id uuid primary key default gen_random_uuid(),
      key_id uuid not null references mcp_keys(id) on delete cascade,
      window_start timestamptz not null,
      requests int not null default 0,
      unique (key_id, window_start)
    );
  `);
});

beforeEach(async () => {
  await pool.query("truncate mcp_rate_limits, mcp_keys, invite_codes cascade");
});

afterAll(async () => {
  await pool.end();
});

describe("createInviteCodes", () => {
  it("creates one code with an explicit code and max_uses", async () => {
    const [code] = await access.createInviteCodes({ code: "DOCKET-TEST-1", maxUses: 5 });
    expect(code.code).toBe("DOCKET-TEST-1");
    expect(code.maxUses).toBe(5);
    expect(code.usedCount).toBe(0);
    expect(code.scopes).toEqual(REGISTER_SCOPES);
  });

  it("generates distinct auto codes when bulk-creating", async () => {
    const codes = await access.createInviteCodes({ prefix: "BATCH", count: 5, maxUses: 1 });
    expect(codes).toHaveLength(5);
    const unique = new Set(codes.map((c) => c.code));
    expect(unique.size).toBe(5);
    expect(codes.every((c) => c.code.startsWith("BATCH-"))).toBe(true);
  });
});

describe("issueKey", () => {
  it("issues a key with a plaintext secret + the code's scopes", async () => {
    const [invite] = await access.createInviteCodes({ code: "DOCKET-REG", maxUses: 3 });
    const result = await access.issueKey({ code: "DOCKET-REG", owner: "builder@example.com" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plaintext.startsWith("dk_")).toBe(true);
    expect(result.key.owner).toBe("builder@example.com");
    expect(result.key.scopes).toEqual(invite.scopes);
  });

  it("rejects an unknown code", async () => {
    const result = await access.issueKey({ code: "NOPE", owner: "a@b.com" });
    expect(result.ok).toBe(false);
  });

  it("rejects a revoked code", async () => {
    const [invite] = await access.createInviteCodes({ code: "DOCKET-REVOKED", maxUses: 5 });
    await access.revokeInviteCode(invite.id);
    const result = await access.issueKey({ code: "DOCKET-REVOKED", owner: "a@b.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("revoked");
  });

  it("enforces max_uses atomically", async () => {
    await access.createInviteCodes({ code: "DOCKET-SINGLE", maxUses: 1 });
    const first = await access.issueKey({ code: "DOCKET-SINGLE", owner: "one@example.com" });
    expect(first.ok).toBe(true);
    const second = await access.issueKey({ code: "DOCKET-SINGLE", owner: "two@example.com" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("use limit");
  });

  it("refuses a second active key for the same owner", async () => {
    await access.createInviteCodes({ code: "DOCKET-MULTI", maxUses: 10 });
    const first = await access.issueKey({ code: "DOCKET-MULTI", owner: "dup@example.com" });
    expect(first.ok).toBe(true);
    const second = await access.issueKey({ code: "DOCKET-MULTI", owner: "dup@example.com" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("already have an active key");
  });

  it("rejects an invalid owner", async () => {
    await access.createInviteCodes({ code: "DOCKET-OWN", maxUses: 5 });
    const result = await access.issueKey({ code: "DOCKET-OWN", owner: "   " });
    expect(result.ok).toBe(false);
  });
});

describe("findKeyByHash", () => {
  it("round-trips an issued key by its hash", async () => {
    await access.createInviteCodes({ code: "DOCKET-FIND", maxUses: 5 });
    const issued = await access.issueKey({ code: "DOCKET-FIND", owner: "find@example.com" });
    if (!issued.ok) throw new Error("setup failed");
    const found = await access.findKeyByHash(hashKeySecret(issued.plaintext));
    expect(found?.owner).toBe("find@example.com");
    expect(found?.id).toBe(issued.key.id);
  });

  it("returns null for an unknown hash", async () => {
    const found = await access.findKeyByHash(hashKeySecret("dk_nonexistent"));
    expect(found).toBeNull();
  });

  it("does not return a revoked key", async () => {
    await access.createInviteCodes({ code: "DOCKET-REVKEY", maxUses: 5 });
    const issued = await access.issueKey({ code: "DOCKET-REVKEY", owner: "rev@example.com" });
    if (!issued.ok) throw new Error("setup failed");
    await access.revokeKey(issued.key.id);
    const found = await access.findKeyByHash(hashKeySecret(issued.plaintext));
    expect(found).toBeNull();
  });
});

describe("consumeRate", () => {
  it("allows up to the cap then blocks within the window", async () => {
    await access.createInviteCodes({ code: "DOCKET-RATE", maxUses: 5 });
    const issued = await access.issueKey({ code: "DOCKET-RATE", owner: "rate@example.com" });
    if (!issued.ok) throw new Error("setup failed");
    const cap = 3;
    const r1 = await access.consumeRate(issued.key.id, cap);
    const r2 = await access.consumeRate(issued.key.id, cap);
    const r3 = await access.consumeRate(issued.key.id, cap);
    const r4 = await access.consumeRate(issued.key.id, cap);
    expect([r1, r2, r3].every((r) => r.allowed)).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
