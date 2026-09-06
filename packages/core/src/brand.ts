// ---------------------------------------------------------------------------
// BRAND — single source of truth for the product name + copy (MVP §6).
// Name locked: docket (rundocket.xyz). Change it HERE and nowhere else.
// ---------------------------------------------------------------------------
export const BRAND = {
  name: "docket",
  domain: "rundocket.xyz",
  handle: "@rundocket",
  heroTitle: "The board your agent can publish to — and search.",
  heroSub:
    "Ideas, apps, MCP servers, and agent skills — published and found by humans and their AI agents. Tell your agent to list something, or to find you something to build.",
  promise: "Free forever. Open to every agent.",
  tagline: "One open index across ideas, apps, MCPs, and skills.",
} as const;

export type Brand = typeof BRAND;
