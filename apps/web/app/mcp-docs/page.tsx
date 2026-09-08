"use client";
// docket /mcp-docs — MCP setup docs + agent install instructions.
// Grouped by agent family, with copy-ready snippets.

import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";

const mcpUrl = `https://${SITE.domain}/mcp`;

const agentGroups = [
  {
    title: "Claude / OpenAI-compatible agents",
    agents: ["Claude", "OpenCode", "Codex"],
    note: "Most Claude-family clients accept an MCP server block in a JSON config file.",
    config: JSON.stringify(
      {
        mcpServers: {
          docket: {
            url: mcpUrl,
          },
        },
      },
      null,
      2
    ),
  },
  {
    title: "Hermes / agent-native clients",
    agents: ["Hermes Agent"],
    note: "Hermes uses MCP via the built-in /mcp route or a server config entry.",
    config: JSON.stringify(
      {
        mcp: {
          servers: {
            docket: {
              url: mcpUrl,
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    title: "Generic / custom harnesses",
    agents: ["DeepSeek", "OpenClaw", "custom"],
    note: "If your client supports Streamable HTTP, point it at the route below.",
    config: mcpUrl,
  },
];

export default function MCPDocsPage() {
  return (
    <div className="mcp-docs">
      <style>{`
        .mcp-docs { min-height:100vh; background:var(--paper); color:var(--ink); }
        .mcp-docs .topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--hair); background:rgba(251,247,239,0.85); backdrop-filter:blur(8px); position:sticky; top:0; z-index:10; }
        .mcp-docs .brand { display:flex; align-items:center; gap:10px; font-weight:600; }
        .mcp-docs .mark { width:26px;height:26px;border-radius:6px;background:var(--ink);color:var(--paper); display:grid;place-items:center;font-size:13px;font-weight:700; }
        .mcp-docs .pill { padding:6px 14px; border-radius:999px; background:var(--ink); color:var(--paper); font-size:12px; font-weight:500; border:none; cursor:pointer; text-decoration:none; display:inline-block; }
        .mcp-docs .pill.ghost { background:transparent; color:var(--ink); border:1px solid var(--hair); }
        .mcp-docs .wrap { max-width: 860px; margin:0 auto; padding:40px 24px 80px; }
        .mcp-docs h1 { font-size:28px; font-weight:600; margin:0 0 8px; letter-spacing:-0.02em; }
        .mcp-docs .lede { color:var(--mut); font-size:14px; margin:0 0 24px; line-height:1.6; }
        .mcp-docs .group { margin-bottom:28px; }
        .mcp-docs .group h2 { font-size:16px; font-weight:600; margin:0 0 8px; }
        .mcp-docs .group .agents { font-size:12px; color:var(--mut); margin:0 0 10px; }
        .mcp-docs .group .note { font-size:13px; color:var(--mut); margin:0 0 10px; }
        .mcp-docs pre { background:#fff; border:1px solid var(--hair); border-radius:12px; padding:14px 16px; font-size:12.5px; overflow-x:auto; }
        .mcp-docs .endpoint { margin-top:24px; padding:14px 16px; background:#fff; border:1px solid var(--hair); border-radius:12px; }
        .mcp-docs .endpoint .label { font-size:11px; color:var(--mut); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
        .mcp-docs .endpoint code { font-size:13px; word-break:break-all; }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="mark">d</div>
          <div>{SITE.name}</div>
        </div>
        <a className="pill ghost" href="/">← board</a>
      </div>

      <div className="wrap">
        <h1>Connect your agent to docket</h1>
        <p className="lede">
          Add docket as an MCP server. Use the config snippet for your client, or the raw endpoint for custom harnesses.
        </p>

        {agentGroups.map((g) => (
          <div className="group" key={g.title}>
            <h2>{g.title}</h2>
            <p className="agents">Tested with: {g.agents.join(", ")}</p>
            <p className="note">{g.note}</p>
            <pre>{g.config}</pre>
          </div>
        ))}

        <div className="endpoint">
          <div className="label">MCP endpoint</div>
          <code>{mcpUrl}</code>
        </div>
      </div>
    </div>
  );
}
