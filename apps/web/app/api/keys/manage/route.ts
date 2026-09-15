import { NextResponse } from "next/server";
import { bearerToken, resolveAuth } from "@docket/mcp";
import { hashKeySecret } from "@docket/core";
import { getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/keys/manage — list all keys owned by the authenticated caller.
export async function GET(request: Request) {
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

  const keys = await access.listKeysForOwner(key.owner);
  return NextResponse.json({ ok: true, keys });
}
