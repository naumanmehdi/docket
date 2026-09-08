import { NextResponse } from "next/server";
import { getAccessStore } from "@/lib/store";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusOf(k: { revoked: boolean }): "active" | "revoked" {
  return k.revoked ? "revoked" : "active";
}

// GET /api/admin/mcp-keys — list every issued key with owner, scopes, usage.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const keys = await getAccessStore().listMcpKeys();
  return NextResponse.json(
    keys.map((k) => ({
      id: k.id,
      owner: k.owner,
      scopes: k.scopes,
      invite_code: k.inviteCode,
      status: statusOf(k),
      last_used_at: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      created_at: k.createdAt.toISOString(),
    }))
  );
}
