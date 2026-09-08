// Per-identity MCP access: invite codes, issued keys, and per-key rate limits.
// Shared by the self-serve registration endpoint, the admin endpoints, and the
// MCP auth path (which looks a presented key up by its sha256 hash). Lives in
// @docket/core so every host (web route, MCP server) uses the same store.

import { createHash, randomBytes } from "node:crypto";
import type pg from "pg";

export type KeyScope = "read" | "write" | "admin";
export const KEY_SCOPES: KeyScope[] = ["read", "write", "admin"];
/** Scopes a normal registrant gets: full access EXCEPT the private owner digest. */
export const REGISTER_SCOPES: KeyScope[] = ["read", "write"];

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  scopes: KeyScope[];
  expiresAt: Date | null;
  revoked: boolean;
  createdAt: Date;
}

export interface McpKey {
  id: string;
  owner: string;
  scopes: KeyScope[];
  inviteCode: string | null;
  lastUsedAt: Date | null;
  revoked: boolean;
  createdAt: Date;
}

export type IssueResult =
  | { ok: true; key: McpKey; plaintext: string }
  | { ok: false; error: string };

export interface InviteCreateInput {
  /** Explicit code (used when count === 1). Optional. */
  code?: string;
  /** Prefix for auto-generated codes, e.g. "DOCKET" -> DOCKET-7K2QZR. */
  prefix?: string;
  /** How many codes to mint. 1 if not given. */
  count?: number;
  maxUses: number;
  scopes?: KeyScope[];
  expiresAt?: string | null;
}

export interface RateDecision {
  allowed: boolean;
  /** Remaining requests in the current window (0 when blocked). */
  remaining: number;
}

export interface AccessStore {
  /* invite codes */
  createInviteCodes(input: InviteCreateInput): Promise<InviteCode[]>;
  listInviteCodes(): Promise<InviteCode[]>;
  revokeInviteCode(id: string): Promise<boolean>;
  /* issued keys */
  issueKey(input: { code: string; owner: string }): Promise<IssueResult>;
  findKeyByHash(hash: string): Promise<McpKey | null>;
  markKeyUsed(id: string): Promise<void>;
  listMcpKeys(): Promise<McpKey[]>;
  revokeKey(id: string): Promise<boolean>;
  /* per-key rate limiting */
  consumeRate(keyId: string, limitPerHour: number): Promise<RateDecision>;
}

/** One leaked/misused per-identity key may issue at most this many MCP calls/hour. */
export const DEFAULT_KEY_RATE_PER_HOUR = 100;

export function generateKeySecret(): string {
  return `dk_${randomBytes(24).toString("base64url")}`;
}

/** Deterministic one-way hash of a key secret — what we store + look up by. */
export function hashKeySecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** A short, unambiguous auto-generated code suffix (A-Z + 2-7, no 0/O/1/I). */
function randomSuffix(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

/** Accepts an email address or a bare handle (X/GitHub style). */
export function validOwner(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return null;
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const looksLikeHandle = /^@?[A-Za-z0-9_]{1,50}$/.test(trimmed);
  return looksLikeEmail || looksLikeHandle ? trimmed.replace(/^@/, "") : null;
}

function mapInvite(row: Record<string, unknown>): InviteCode {
  return {
    id: row.id as string,
    code: row.code as string,
    maxUses: row.max_uses as number,
    usedCount: row.used_count as number,
    scopes: (row.scopes as string[] ?? ["read", "write"]) as KeyScope[],
    expiresAt: (row.expires_at as Date | null) ?? null,
    revoked: row.revoked as boolean,
    createdAt: row.created_at as Date,
  };
}

function mapKey(row: Record<string, unknown>): McpKey {
  return {
    id: row.id as string,
    owner: row.owner as string,
    scopes: (row.scopes as string[] ?? ["read", "write"]) as KeyScope[],
    inviteCode: (row.invite_code as string | null) ?? null,
    lastUsedAt: (row.last_used_at as Date | null) ?? null,
    revoked: row.revoked as boolean,
    createdAt: row.created_at as Date,
  };
}

function cleanScopes(raw: unknown): KeyScope[] {
  const arr = Array.isArray(raw) ? raw : [raw];
  const scopes = arr.filter((s): s is KeyScope => typeof s === "string" && (KEY_SCOPES as string[]).includes(s));
  // Never mint a key that's MORE privileged than read+write unless explicitly asked;
  // but an empty filter (bad input) still falls back to the register default.
  return scopes.length > 0 ? scopes : [...REGISTER_SCOPES];
}

export function createAccessStore(pool: pg.Pool): AccessStore {
  const createInviteCodes = async (input: InviteCreateInput): Promise<InviteCode[]> => {
    const count = Math.min(Math.max(Math.trunc(input.count ?? 1), 1), 100);
    const scopes = cleanScopes(input.scopes);
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const prefix = (input.prefix ?? "DOCKET").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(input.code && count === 1 ? input.code.toUpperCase() : `${prefix}-${randomSuffix(6)}`);
    }
    const created: InviteCode[] = [];
    for (const code of codes) {
      const { rows } = await pool.query(
        `insert into invite_codes (code, max_uses, scopes, expires_at)
         values ($1, $2, $3, $4) returning *`,
        [code, input.maxUses, scopes, expiresAt]
      );
      created.push(mapInvite(rows[0]!));
    }
    return created;
  };

  const listInviteCodes = async (): Promise<InviteCode[]> => {
    const { rows } = await pool.query(
      `select * from invite_codes order by created_at desc`
    );
    return rows.map(mapInvite);
  };

  const revokeInviteCode = async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `update invite_codes set revoked = true where id = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  };

  const issueKey = async (input: { code: string; owner: string }): Promise<IssueResult> => {
    const owner = validOwner(input.owner);
    if (!owner) return { ok: false, error: "owner must be an email address or handle" };
    const code = input.code.trim().toUpperCase();
    const secret = generateKeySecret();
    const hash = hashKeySecret(secret);

    const client = await pool.connect();
    try {
      await client.query("begin");
      // Lock the invite row so concurrent registrations can't overshoot max_uses.
      const { rows: inviteRows } = await client.query(
        `select * from invite_codes where code = $1 for update`,
        [code]
      );
      const invite = inviteRows[0];
      if (!invite) {
        await client.query("rollback");
        return { ok: false, error: "invalid invite code" };
      }
      if (invite.revoked) {
        await client.query("rollback");
        return { ok: false, error: "this invite code has been revoked" };
      }
      if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
        await client.query("rollback");
        return { ok: false, error: "this invite code has expired" };
      }
      if (invite.used_count >= invite.max_uses) {
        await client.query("rollback");
        return { ok: false, error: "this invite code has reached its use limit" };
      }

      const scopes = (invite.scopes as string[] ?? ["read", "write"]) as KeyScope[];
      let keyRow: Record<string, unknown> | undefined;
      try {
        const { rows } = await client.query(
          `insert into mcp_keys (key_hash, owner, scopes, invite_code_id)
           values ($1, $2, $3, $4) returning *`,
          [hash, owner, scopes, invite.id]
        );
        keyRow = rows[0];
      } catch (err) {
        await client.query("rollback");
        // The partial unique index on active owner guards against duplicates.
        return { ok: false, error: "you already have an active key; use or revoke it before requesting another" };
      }

      await client.query(
        `update invite_codes set used_count = used_count + 1 where id = $1`,
        [invite.id]
      );
      await client.query("commit");
      return { ok: true, key: mapKey(keyRow!), plaintext: secret };
    } catch (err) {
      try {
        await client.query("rollback");
      } catch {
        /* noop */
      }
      throw err;
    } finally {
      client.release();
    }
  };

  const findKeyByHash = async (hash: string): Promise<McpKey | null> => {
    const { rows } = await pool.query(
      `select k.*, c.code as invite_code
         from mcp_keys k
         left join invite_codes c on c.id = k.invite_code_id
        where k.key_hash = $1 and k.revoked = false`,
      [hash]
    );
    return rows[0] ? mapKey(rows[0]) : null;
  };

  const markKeyUsed = async (id: string): Promise<void> => {
    await pool.query(`update mcp_keys set last_used_at = now() where id = $1`, [id]);
  };

  const listMcpKeys = async (): Promise<McpKey[]> => {
    const { rows } = await pool.query(
      `select k.*, c.code as invite_code
         from mcp_keys k
         left join invite_codes c on c.id = k.invite_code_id
         order by k.created_at desc`
    );
    return rows.map(mapKey);
  };

  const revokeKey = async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `update mcp_keys set revoked = true where id = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  };

  const consumeRate = async (keyId: string, limitPerHour: number): Promise<RateDecision> => {
    const cap = Math.max(1, Math.trunc(limitPerHour));
    const { rows } = await pool.query(
      `insert into mcp_rate_limits (key_id, window_start, requests)
       values ($1, date_trunc('hour', now()), 1)
       on conflict (key_id, window_start)
       do update set requests = mcp_rate_limits.requests + 1
       where mcp_rate_limits.requests < $2
       returning requests`,
      [keyId, cap]
    );
    if (rows[0]) return { allowed: true, remaining: Math.max(0, cap - (rows[0].requests as number)) };
    // Hit the cap: report when the window resets (top of the current hour).
    return { allowed: false, remaining: 0 };
  };

  return {
    createInviteCodes,
    listInviteCodes,
    revokeInviteCode,
    issueKey,
    findKeyByHash,
    markKeyUsed,
    listMcpKeys,
    revokeKey,
    consumeRate,
  };
}
