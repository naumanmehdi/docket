import { timingSafeEqual } from "node:crypto";

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

/** Constant-time string comparison (length-leaking only). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
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
