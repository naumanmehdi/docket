import "server-only";
import { bearerToken, safeEqual } from "@docket/mcp";

/**
 * Admin endpoints are gated by the owner's master key(s): either MCP_ADMIN_KEY
 * or MCP_API_KEY in the Authorization header. Constant-time comparison, and it
 * returns false when neither env key is set (fail-closed). DB-issued keys never
 * pass here — the admin surface is owner-only.
 */
export function isAdminRequest(request: Request): boolean {
  const admin = process.env.MCP_ADMIN_KEY;
  const pub = process.env.MCP_API_KEY;
  const token = bearerToken(request.headers);
  if (!token) return false;
  if (admin && safeEqual(token, admin)) return true;
  if (pub && safeEqual(token, pub)) return true;
  return false;
}

export function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
