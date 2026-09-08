import { NextResponse } from "next/server";
import { getAccessStore } from "@/lib/store";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/mcp-keys/revoke — revoke a key (kills that key's access now).
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON body"] }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id.trim() : "";

  try {
    const did = await getAccessStore().revokeKey(id);
    return did
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, errors: ["key not found"] }, { status: 404 });
  } catch (err) {
    console.error("admin mcp-keys revoke failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}
