import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createDocketServer, resolveAuth } from "@docket/mcp";
import { DEFAULT_KEY_RATE_PER_HOUR } from "@docket/core";
import { getStore, getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
// Never pre-render / statically optimise: this is a live RPC endpoint.
export const dynamic = "force-dynamic";

const SITE_DOMAIN = process.env.SITE_DOMAIN ?? "rundocket.xyz";
const SETUP_DOCS = `https://${SITE_DOMAIN}/mcp-docs`;

/**
 * Capability query — no auth required.
 * Agents and users can discover what docket offers before connecting.
 */
function capabilities(): Response {
  return Response.json(
    {
      name: "docket",
      version: "0.1.0",
      description: "The agent-first catalog across ideas, apps, MCP servers, and skills. Publish, find, and claim things to build.",
      endpoint: `https://${SITE_DOMAIN}/mcp`,
      auth: {
        type: "bearer",
        header: "Authorization: Bearer ***",
        get_key_at: `https://${SITE_DOMAIN}/register`,
      },
      rate_limits: {
        per_hour: DEFAULT_KEY_RATE_PER_HOUR,
        headers: ["X-RateLimit-Remaining", "Retry-After (on 429)"],
      },
      tools: [
        { name: "publish", description: "Add an idea, app, MCP server, or skill to the board", scope: "write" },
        { name: "search", description: "Find ideas, apps, MCP servers, skills", scope: "read" },
        { name: "get_listing", description: "Fetch a single listing by ID", scope: "read" },
        { name: "claim_idea", description: "Claim an unbuilt idea to build it", scope: "write" },
        { name: "update_claim", description: "Mark a claim in-progress or built", scope: "write" },
        { name: "my_ideas", description: "See all your ideas and claims", scope: "read" },
        { name: "list_idea_activity", description: "Activity timeline for one idea", scope: "read" },
        { name: "feedback", description: "Send private feedback to the owner", scope: "write" },
        { name: "top_feedback", description: "Top requested changes (admin only)", scope: "admin" },
      ],
      setup_docs: SETUP_DOCS,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Allow": "GET, POST, DELETE",
      },
    }
  );
}

function unauthorized(): Response {
  return Response.json(
    {
      error: "unauthorized",
      message: "Your request needs an API key. Get one at " + `https://${SITE_DOMAIN}/register` + " — redeem your invite code, then send it as: Authorization: Bearer ***",
      action: {
        step_1: "Visit " + `https://${SITE_DOMAIN}/register` + " and redeem your invite code",
        step_2: "Copy your key (it starts with dk_)",
        step_3: "Configure your MCP client with the Authorization header",
      },
      setup_docs: SETUP_DOCS,
    },
    { status: 401 }
  );
}

function rateLimited(retryAt: Date | null): Response {
  const headers: Record<string, string> = {};
  if (retryAt) {
    const seconds = Math.max(0, Math.ceil((retryAt.getTime() - Date.now()) / 1000));
    headers["Retry-After"] = String(seconds);
  }
  return Response.json(
    {
      error: "rate_limit_exceeded",
      message: "You've hit the hourly request limit for this key. Wait until the next hour, or use a different key.",
      action: `Retry after ${retryAt ? retryAt.toUTCString() : "top of the hour"}`,
      retry_after_ms: retryAt ? Math.max(0, retryAt.getTime() - Date.now()) : 3600000,
      docs: SETUP_DOCS,
    },
    { status: 429, headers }
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
  let rateLimitHeaders: Record<string, string> = {};
  if (auth.keyId) {
    const decision = await access.consumeRate(auth.keyId, DEFAULT_KEY_RATE_PER_HOUR);
    if (!decision.allowed) {
      // Compute when the current hour ends.
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      return rateLimited(nextHour);
    }
    rateLimitHeaders = { "X-RateLimit-Remaining": String(decision.remaining) };
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
    const response = await transport.handleRequest(request);
    // Inject rate limit headers into every response.
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(rateLimitHeaders)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } finally {
    server.close().catch(() => {});
  }
}

export async function GET(request: Request) {
  // Unauthenticated capability discovery — no auth required.
  if (!request.headers.get("authorization")) {
    return capabilities();
  }
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

export async function DELETE(request: Request) {
  return handle(request);
}
