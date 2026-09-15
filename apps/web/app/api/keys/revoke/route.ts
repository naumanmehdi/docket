import { NextResponse } from "next/server";
import { bearerToken, resolveAuth } from "@docket/mcp";
import { hashKeySecret } from "@docket/core";
import { getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/keys/revoke — revoke one of your own keys.
// Body: { key_id: string }
export async function POST(request: Request) {
  const access = getAccessStore();
  const auth = await resolveAuth(request.headers, { access });

  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authentication required." },
      { status: 401 }
    );
  }

  if (auth.origin === "master-admin" || auth.origin === "master-public") {
    return NextResponse.json(
      { error: "forbidden", message: "Master keys cannot manage user keys." },
      { status: 403 }
    );
  }

  const token = bearerToken(request.headers);
  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", message: "Missing bearer token." },
      { status: 401 }
    );
  }
  const hash = hashKeySecret(token);
  const key = await access.findKeyByHash(hash);
  if (!key) {
    return NextResponse.json(
      { error: "unauthorized", message: "Key not found." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const keyId = typeof b.key_id === "string" ? b.key_id.trim() : "";
  if (!keyId) {
    return NextResponse.json(
      { error: "missing_key_id", message: "key_id is required." },
      { status: 400 }
    );
  }

  const result = await access.revokeUserKey(keyId, key.owner);
  if (!result.ok) {
    return NextResponse.json(
      { error: "revoke_failed", message: result.error ?? "Unable to revoke key." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
