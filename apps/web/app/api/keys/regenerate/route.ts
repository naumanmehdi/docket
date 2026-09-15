import { NextResponse } from "next/server";
import { bearerToken, resolveAuth } from "@docket/mcp";
import { hashKeySecret } from "@docket/core";
import { getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/keys/regenerate — regenerate one of your own keys.
// Body: { key_id: string }
// The plaintext secret is shown exactly once.
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

  const result = await access.regenerateUserKey(keyId, key.owner);
  if (!result.ok) {
    return NextResponse.json(
      { error: "regenerate_failed", message: result.error ?? "Unable to regenerate key." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    key: result.key,
    plaintext: result.plaintext,
    warning: "Copy this key now — it won't be shown again.",
  });
}
