import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createDocketServer, resolveAuth } from "@docket/mcp";
import { DEFAULT_KEY_RATE_PER_HOUR } from "@docket/core";
import { getStore, getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
// Never pre-render / statically optimise: this is a live RPC endpoint.
export const dynamic = "force-dynamic";

/**
 * /api/mcp — the docket MCP server hosted on the same Vercel deployment as the
 * web app (rewritten to /mcp by vercel.json).
 *
 * THREE auth tiers (see packages/mcp/src/auth.ts → resolveAuth), fail-closed:
 *  - MCP_ADMIN_KEY  = owner master key → scopes read+write+admin (owner tools).
 *  - MCP_API_KEY    = shared public master key → scopes read+write.
 *  - an issued per-identity key (from /api/mcp-keys/register) → its own scopes.
 * External clients are meant to use their issued key. Revoked keys are rejected.
 *
 * A DB-issued key is additionally rate-limited per hour (see mcp_rate_limits).
 * Vercel functions are stateless lambdas, so we build a fresh transport + fresh
 * MCP server per HTTP request (stateless JSON-response mode).
 */

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

function rateLimited(): Response {
  return Response.json(
    { error: "rate limit exceeded — try again at the top of the hour" },
    { status: 429 }
  );
}

async function handle(request: Request): Promise<Response> {
  const publicKey = process.env.MCP_API_KEY;
  const adminKey = process.env.MCP_ADMIN_KEY;
  const access = getAccessStore();

  // Resolve the bearer token to a scope set (env master key OR DB-issued key).
  const auth = await resolveAuth(request.headers, {
    access,
    adminMasterKey: adminKey,
    publicMasterKey: publicKey,
  });
  if (!auth.ok) return unauthorized();

  // Enforce the per-key hourly budget for DB-issued keys. Master keys skip it.
  if (auth.keyId) {
    const decision = await access.consumeRate(auth.keyId, DEFAULT_KEY_RATE_PER_HOUR);
    if (!decision.allowed) return rateLimited();
    // Best-effort "last used" stamp for the admin table.
    access.markKeyUsed(auth.keyId).catch(() => {});
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = createDocketServer({
    store: getStore(),
    scopes: auth.scopes,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } finally {
    server.close().catch(() => {});
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

export async function DELETE(request: Request) {
  return handle(request);
}
