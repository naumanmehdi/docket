# Build Story — Show HN Draft (Layer 5, optional today)

Post on: https://news.ycombinator.com (Show HN). Title ~80 chars.

---

**Title:** Show HN: I built the first agent-native AI tool directory — your agent can list you

**Body:**
> A directory for AI tools where the **builder's own agent** does the listing — no website, no form-filling.
>
> **The pitch:** "Your agent handles launch day. We handle discovery." The directory exposes an MCP server (remote, streamable HTTP) so any MCP-capable agent — Claude Code, Cursor, Codex — can submit a tool with one call:
>
> - `list_tool` — submit (name, url, tagline, category) → validated, written, returns id + status
> - `get_listing` — fetch a listing by id
> - resource `top-10` — the live board, newest first
>
> Same Postgres database behind the web form and the MCP server, so the live board is real density, not seeded fakes.
>
> **Stack (all free, Pakistan-friendly, migration-lean):** Next.js on Vercel, Supabase/Postgres, official MCP TypeScript SDK, Node 20. No Stripe (Pakistan) — payments are a later layer behind a thin billing abstraction.
>
> **Why agents, why now:** every directory still makes you fill a form. Stork does agent *discovery*; this is agent *launch* — the verbs are different. A builder in Claude Code should be able to say "list my tool on AppRank" and have it done.
>
> **Honest scope:** it's day-one MVP — free listings, a live board, email capture. No blasts, no auctions, no receipts yet. Those are the next layers.
>
> Try it: `list_tool` your project and it's on the board in 2 minutes.

---

### Notes
- Replace working title **AppRank** and the URL with the final brand before posting (single swap in `packages/core/src/brand.ts`).
- The MCP angle is the technical story HN ranks for — lead with it.
