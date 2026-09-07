import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createDocketServer, authorize, bearerToken } from "@docket/mcp";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
// Never pre-render / statically optimise: this is a live RPC endpoint.
export const dynamic = "force-dynamic";

/**
 * /api/mcp — the docket MCP server hosted on the same Vercel deployment as the
 * web app (rewritten to /mcp by vercel.json).
 *
 * TWO auth tiers:
 *  - MCP_API_KEY   = public key. Can submit feedback, search, publish, claim.
 *  - MCP_ADMIN_KEY = owner key. Adds the private owner tools (top_feedback).
 * External clients connect with MCP_API_KEY when /mcp is shared in llms.txt;
 * they cannot read the private feedback digest because the owner tools are
 * only enabled when the request authenticated with the admin key.
 *
 * Vercel functions are stateless lambdas, so we use the MCP **stateless**
 * JSON-response mode: each HTTP request builds a fresh transport + fresh MCP
 * server, handles the request, and returns.
 */

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

async function handle(request: Request): Promise<Response> {
  const publicKey = process.env.MCP_API_KEY;
  const adminKey = process.env.MCP_ADMIN_KEY;

  // Resolve tier: admin key (if set) wins, then public key. Fail closed.
  let feedbackAdminKey: string | undefined;
  const token = bearerToken(request.headers);
  if (adminKey && token && authorize(request.headers, adminKey)) {
    feedbackAdminKey = adminKey; // enable owner-only tools for this request
  } else if (publicKey && authorize(request.headers, publicKey)) {
    // public tier — owner tools stay disabled
  } else {
    return unauthorized();
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = createDocketServer({
    store: getStore(),
    feedbackAdminKey,
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