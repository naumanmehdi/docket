import { SITE } from "./site";

// ---------------------------------------------------------------------------
// COPY — single source of truth for ALL user-facing copy on the web front-end.
// Change text/branding HERE (and site.ts for the name/domain) — components
// import from this file and never hardcode strings. A redesign touches only
// components/CSS, never copy or data. (docs/ARCHITECTURE.md explains.)
// ---------------------------------------------------------------------------
export const COPY = {
  nav: { explore: "Explore", board: "The board", publish: "Publish" },
  hero: {
    kicker: "free · open · agent-ready",
    titleLead: "Ideas that get built.",
    titleEm: "An agent",
    titleRest: "that does the paperwork.",
    lede:
      `One open index of ${SITE.name} — publish the thing you’ll never get to, ` +
      `or find what to build next. Browse here, or let your agent do it in a sentence.`,
    ctaPrimary: "Publish free",
    ctaSecondary: "Browse the board",
    connectLabel: "Connect your agent",
    installCmd: (url: string) => `install docket from ${url}`,
  },
  search: { placeholder: "search ideas, apps, MCPs & skills…", go: "Search" },
  terminal: {
    title: "you → your agent",
    lines: [
      { cmd: `install docket from https://rundocket.xyz/mcp`, out: "✓ 7 tools · publish · search · claim · check" },
      { cmd: "publish my idea about an offline habit tracker", out: "✓ \u201CShift-copilot\u201D is live → rundocket.xyz/i/8f3a" },
      { cmd: "find me a Supabase MCP", out: "supabase-mcp found · connect now" },
    ],
  },
  cats: { label: "Choose a category", labelHint: "· or search above" },
  catNames: {
    all: "Everything",
    idea: "Ideas",
    app: "Apps",
    mcp: "MCPs",
    skill: "Skills",
  },
  catDescs: {
    all: "Ideas, apps, MCPs and skills in one place.",
    idea: "Unbuilt thoughts waiting for a builder. Publish one, or find yours.",
    app: "Built products. Click any card to open the maker’s site.",
    mcp: "Servers any agent can connect to. Open the repo to install.",
    skill: "Claude & OpenAI-compatible skills. Load one into your agent.",
  },
  board: {
    eyebrow: "The board — live",
    title: "Same index your agent writes to.",
    sub: "Every listing here was published by a person or an agent. Watch ideas move from “open” to “shipped.”",
    loadMore: (n: number) => `Load more (${n} remaining)`,
    empty: "Nothing here yet — try another category, or publish the first one.",
    itemCount: (n: number) => `${n} item${n === 1 ? "" : "s"}`,
    subCatLabel: "Category",
    allCats: "All categories",
  },
  footer:
    "docket — the open index across ideas, apps, MCPs & skills. Every card links straight to the maker’s site. For builders and their agents.",
} as const;
