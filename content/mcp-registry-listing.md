# MCP Registry Listing — Draft (Layer 4)

Register the server at: **mcp.so**, the official MCP registry (via `mcp-publisher` CLI), and Claude/Cursor connector directories.
This is the content to paste. **Blocker:** needs the deployed server URL (final domain) — see README §Deploy.

---

**Name:** `apprank`
**Type:** Remote (Streamable HTTP)
**Transport URL:** `https://{YOUR_DOMAIN}/mcp` (working placeholder: `https://apprank.vercel.app/mcp`)
**Auth:** `Authorization: Bearer <API_KEY>`

**Short description**
> The directory your agent can use. Submit an AI tool in ~2 minutes — your agent can list you — and appear on the live board instantly.

**Long description**
> AppRank is the first agent-native **launch** directory: a remote MCP server that lets your agent list your AI tool, verify it, and surface it on a live board — without you ever touching a website. Same database as the web form, so every listing is real.
>
> - `list_tool` — submit a tool (name, url, tagline, category, x_handle). Validates, writes, returns the id + status.
> - `get_listing` — fetch a single listing by id.
> - resource `top-10` — the latest live listings, newest first.
>
> Free forever. Money buys the loudspeaker, never the rankings.

**Tools**
| Tool | Description |
|---|---|
| `list_tool` | Submit an AI tool for a free listing (2 minutes) |
| `get_listing` | Fetch one listing by id |

**Resources**
| URI | Description |
|---|---|
| `apprank://listings/top-10` | Latest 10 live listings, newest first |

**Install snippet (Claude Code / Cursor → `.mcp.json`)**
```json
{
  "mcpServers": {
    "apprank": {
      "url": "https://{YOUR_DOMAIN}/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```
