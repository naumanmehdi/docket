import { createHash, timingSafeEqual } from "node:crypto";
import { hashKeySecret, type AccessStore, type KeyScope } from "@docket/core";

export type HeaderSource = Headers | Record<string, string | string[] | number | undefined>;

export function getHeader(headers: HeaderSource, name: string): string | null {
  if (headers instanceof Headers) {
    const v = headers.get(name);
    return v ?? null;
  }
  const value = headers[name.toLowerCase()];
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : String(value);
}

/** Extracts a bearer token from an Authorization header, or null. */
export function bearerToken(headers: HeaderSource): string | null {
  const auth = getHeader(headers, "authorization");
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return match ? match[1]!.trim() : null;
}

/**
 * Constant-time string comparison. Both inputs are hashed to fixed-size digests
 * BEFORE the timing-sensitive comparison, so the runtime is independent of the
 * inputs' lengths (closes the length side-channel that a raw length check leaks).
 */
export function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

/**
 * API-key auth: the request must carry an `Authorization: Bearer <token>` header
 * whose token matches `expectedKey`. Returns false when expectedKey is unset, so
 * a misconfigured server refuses every request rather than accepting anonymous
 * access. Uses constant-time comparison (see safeEqual).
 */
export function authorize(headers: HeaderSource, expectedKey: string | undefined): boolean {
  if (!expectedKey) return false;
  const token = bearerToken(headers);
  if (!token) return false;
  return safeEqual(token, expectedKey);
}

/* ---------------------------------------------------------------------------
   Per-identity resolution: a DB-backed key OR one of the env master keys.
   ------------------------------------------------------------------------- */

export type AuthOrigin = "key" | "master-admin" | "master-public";

export interface AuthResolution {
  ok: true;
  /** Scopes granted to the caller. Never empty for a successful resolution. */
  scopes: KeyScope[];
  /** DB-backed key id when the caller used an issued key; null for env masters. */
  keyId: string | null;
  origin: AuthOrigin;
}

export type ResolveResult = AuthResolution | { ok: false };

export interface ResolveDeps {
  /** Look up a DB-issued key by the sha256 hash of the presented secret. */
  access?: AccessStore;
  /** The owner/admin master key (grants read+write+admin). Optional. */
  adminMasterKey?: string;
  /** The shared public master key (grants read+write). Optional. */
  publicMasterKey?: string;
}

/**
 * Resolve a request's bearer token to a set of MCP scopes, fail-closed.
 * Precedence: env master keys (constant-time, no DB hit for owner calls) first,
 * then a DB-issued per-identity key looked up by hash. Revoked keys are never
 * returned (the access store filters them). Returns { ok:false } on no/mismatch.
 */
export async function resolveAuth(
  headers: HeaderSource,
  deps: ResolveDeps
): Promise<ResolveResult> {
  const token = bearerToken(headers);
  if (!token) return { ok: false };

  if (deps.adminMasterKey && safeEqual(token, deps.adminMasterKey)) {
    return { ok: true, scopes: ["read", "write", "admin"], keyId: null, origin: "master-admin" };
  }
  if (deps.publicMasterKey && safeEqual(token, deps.publicMasterKey)) {
    return { ok: true, scopes: ["read", "write"], keyId: null, origin: "master-public" };
  }
  if (deps.access) {
    const key = await deps.access.findKeyByHash(hashKeySecret(token));
    if (key) {
      return { ok: true, scopes: key.scopes, keyId: key.id, origin: "key" };
    }
  }
  return { ok: false };
}
