import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const url = process.env.MCP_URL ?? "http://localhost:3000/api/mcp";
const key = process.env.MCP_API_KEY ?? "pub-key-123";
const adminKey = process.env.MCP_ADMIN_KEY ?? "admin-key-456";

async function connect(k) {
  const t = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${k}` } },
  });
  const c = new Client({ name: "feedback-check", version: "0.0.1" });
  await c.connect(t);
  return c;
}

try {
  // 1. Public key: list tools, submit feedback (allowed), top_feedback (REFUSED)
  const pub = await connect(key);
  const tools = await pub.listTools();
  const names = tools.tools.map((t) => t.name);
  console.log("PUBLIC tools:", names.join(", "));

  const fb = await pub.callTool({ name: "feedback", arguments: { message: "please add a web claim button", kind: "app" } });
  console.log("PUBLIC feedback submit ->", fb.content[0].text);

  const denied = await pub.callTool({ name: "top_feedback", arguments: {} });
  console.log("PUBLIC top_feedback (expect error) ->", denied.content[0].text);
  await pub.close();

  // 2. Admin key: top_feedback allowed
  const adm = await connect(adminKey);
  const top = await adm.callTool({ name: "top_feedback", arguments: { limit: 5 } });
  console.log("ADMIN top_feedback ->", top.content[0].text);
  await adm.close();

  console.log("DONE");
} catch (err) {
  console.error("FAILED:", err);
  process.exit(1);
}