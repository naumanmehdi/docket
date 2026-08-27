import http from "node:http";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createStore, createPool } from "@apprank/core";
import { createApprankServer } from "./server.js";
import { authorize } from "./auth.js";

export interface StartServerOptions {
  databaseUrl: string;
  mcpApiKey: string;
  port?: number;
}

export interface RunningServer {
  url: string;
  close(): Promise<void>;
}

/**
 * Remote streamable-HTTP MCP server (stateless-friendly JSON responses).
 * API-key auth is enforced at the HTTP edge before any MCP message is handled.
 */
export async function startServer(options: StartServerOptions): Promise<RunningServer> {
  const pool = createPool(options.databaseUrl);
  const store = createStore(pool);
  const server = createApprankServer({ store });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    enableJsonResponse: true,
  });
  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (!authorize(req.headers, options.mcpApiKey)) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    try {
      const body = await readBody(req);
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const request = new Request(url, {
        method: req.method ?? "GET",
        headers: new Headers(req.headers as unknown as Record<string, string>),
        body: body.length > 0 ? body : undefined,
      });
      const response = await transport.handleRequest(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "internal_error" }));
    }
  });

  await new Promise<void>((resolve) => httpServer.listen(options.port ?? 0, resolve));

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : options.port;
  return {
    url: `http://localhost:${port}`,
    close: () => new Promise((resolve) => httpServer.close(() => resolve())),
  };
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// CLI entrypoint
const isMain = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isMain) {
  const databaseUrl = process.env.DATABASE_URL;
  const mcpApiKey = process.env.MCP_API_KEY;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!mcpApiKey) {
    console.error("MCP_API_KEY is required");
    process.exit(1);
  }
  const port = Number(process.env.PORT ?? "3001");
  startServer({ databaseUrl, mcpApiKey, port }).then((s) => {
    console.log(`AppRank MCP server listening on ${s.url}`);
  });
}
