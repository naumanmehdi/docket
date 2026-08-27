import { createHash, timingSafeEqual } from "node:crypto";

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
 * API-key auth: the request must carry `Authorization: Bearer <expectedKey>`.
 * Returns false when expectedKey is unset, so a misconfigured server refuses
 * every request rather than accepting anonymous access.
 */
export function authorize(headers: HeaderSource, expectedKey: string | undefined): boolean {
  if (!expectedKey) return false;
  const token = bearerToken(headers);
  if (!token) return false;
  return safeEqual(token, expectedKey);
}
