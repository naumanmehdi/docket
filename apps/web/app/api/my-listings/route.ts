import { resolveAuth, bearerToken } from "@docket/mcp";
import { getStore, getAccessStore } from "@/lib/store";
import { hashKeySecret } from "@docket/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await resolveAuth(request.headers, {
    access: getAccessStore(),
    adminMasterKey: process.env.MCP_ADMIN_KEY,
    publicMasterKey: process.env.MCP_API_KEY,
  });
  if (!auth.ok) {
    return Response.json(
      { error: "unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }
  if (auth.origin === "master-admin" || auth.origin === "master-public") {
    return Response.json(
      { error: "forbidden", message: "Master keys cannot access user data" },
      { status: 403 }
    );
  }
  try {
    const token = bearerToken(request.headers);
    if (!token) {
      return Response.json(
        { error: "unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      );
    }
    const hash = hashKeySecret(token);
    const access = getAccessStore();
    const key = await access.findKeyByHash(hash);
    if (!key) {
      return Response.json(
        { error: "unauthorized", message: "Key not found" },
        { status: 401 }
      );
    }
    const store = getStore();
    const listings = await store.listMyListings(key.owner);
    return Response.json({ listings });
  } catch (err) {
    return Response.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
