import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createApprankServer, authorize } from "@apprank/mcp";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
// Never pre-render / statically optimise: this is a live RPC endpoint.
export const dynamic = "force-dynamic";

/**
 * /api/mcp — the docket MCP server hosted on the same Vercel deployment as the
 * web app (rewritten to /mcp by vercel.json). This is the agent-native front
 * door: an agent connects here over Streamable HTTP, using Bearer MCP_API_KEY,
 * and gets the same 7 tools the standalone server exposes.
 *
 * Vercel functions are stateless lambdas, so we use the MCP **stateless**
 * JSON-response mode: each HTTP request builds a fresh transport + fresh MCP
 * server, handles the request, and returns. The underlying `Protocol` refuses
 * to connect to more than one transport, so a per-request server is required —
 * and stateless mode is what the SDK explicitly prescribes for share-nothing
 * hosts (enableJsonResponse = single round-trips, no SSE session to keep).
 *
 * /mcp (rewritten here) is SHAREABLE via public config in client apps.
 */

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

async function handle(request: Request): Promise<Response> {
  const apiKey = process.env.MCP_API_KEY;
  if (!authorize(request.headers, apiKey)) {
    return unauthorized();
  }

  // Stateless per-request transport: no sessionIdGenerator, JSON responses on.
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    // Stateless mode: omit sessionIdGenerator so each request is self-contained.
  });
  const server = createApprankServer({ store: getStore() });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } finally {
    // Allow the per-request server+pool to be reclaimed; nothing persists.
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