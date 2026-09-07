import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const url = process.env.MCP_URL ?? "http://localhost:3000/api/mcp";
const key = process.env.MCP_API_KEY ?? "test-key-123";

const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});
const client = new Client({ name: "e2e-check", version: "0.0.1" });

try {
  await client.connect(transport);
  const tools = await client.listTools();
  console.log("CONNECTED. tools:", tools.tools.map((t) => t.name).join(", "));

  // Exercise a write path: publish an idea, then claim it, mark built.
  const pub = await client.callTool({
    name: "publish",
    arguments: {
      kind: "idea",
      name: "e2e smoke test idea",
      tagline: "verifying the /api/mcp route end to end",
      description: "temporary listing; delete after test",
      author: "e2e-check",
    },
  });
  console.log("publish ->", pub.content[0].text);
  const pubId = JSON.parse(pub.content[0].text).id;

  const claim = await client.callTool({
    name: "claim_idea",
    arguments: { idea_id: pubId, author: "e2e-check" },
  });
  console.log("claim_idea ->", claim.content[0].text);

  const get = await client.callTool({
    name: "get_listing",
    arguments: { id: pubId },
  });
  console.log("get_listing ->", get.content[0].text);

  await client.close();
  console.log("DONE — cleanup id:", pubId);
} catch (err) {
  console.error("FAILED:", err);
  process.exit(1);
}