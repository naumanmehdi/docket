import { BRAND, KINDS, type Listing } from "@apprank/core";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

/**
 * /llms.txt — the open, agent-readable index + install manifest (SPEC §8, D8/D13).
 * An agent told to "find me an idea / an MCP / a skill" (or to install the docket MCP) can pull this single plain-text file through its normal tooling and act on
 * it without ever visiting the rendered site.
 */
export async function GET() {
  const mcpUrl = process.env.MCP_URL ?? `https://${BRAND.domain}/mcp`;

  const lines: string[] = [];
  lines.push(`# ${BRAND.name}`);
  lines.push(`> ${BRAND.tagline}`);
  lines.push("");

  // --- Install manifest (agent-native self-install, D13) ---
  lines.push(`## Connect (MCP)`);
  lines.push(
    `To let an agent publish to and search ${BRAND.name}, add a remote MCP server at: ${mcpUrl}`
  );
  lines.push(
    `Authenticate with a bearer API key. Ask your agent to install it from ${mcpUrl} and it can self-configure.`
  );
  lines.push("Tools: publish, search, get_listing, claim_idea, update_claim, my_ideas, list_idea_activity");
  lines.push("");
  lines.push(`## What you can ask your agent`);
  lines.push(`- "publish my idea about ..." (publish, kind=idea)`);
  lines.push(`- "find me something to build" (search, claimable_only=true)`);
  lines.push(`- "is there an MCP for X?" / "any apps that do Y?" / "find a Z skill" (search by kind)`);
  lines.push(`- "check my ideas" (my_ideas)`);
  lines.push("");

  // --- The live board, grouped by kind ---
  const store = getStore();
  const rows = await store.searchListings({ limit: 100 });
  for (const kind of KINDS) {
    const ofKind = rows.filter((r) => r.kind === kind);
    if (ofKind.length === 0) continue;
    lines.push(`## ${kind}s`);
    for (const l of ofKind) lines.push(lineFor(l));
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function lineFor(l: Listing): string {
  const url = l.url ?? l.repo_url ?? "";
  const built = l.claim_state === "built" ? " (built)" : "";
  const claim = l.claim_state && l.claim_state !== "built" ? ` [${l.claim_state}]` : "";
  const loc = url ? ` — ${url}` : "";
  return `- ${l.name}${loc}: ${l.tagline} by ${l.author}${claim}${built}`;
}
