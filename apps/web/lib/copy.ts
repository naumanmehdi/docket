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
      `One open index of ${SITE.name} — publish the thing you'll never get to, ` +
      `or find what to build next. Browse here, or let your agent do it in a sentence.`,
    ctaPrimary: "Publish free",
    ctaSecondary: "Browse the board →",
    connectLabel: "Connect",
    installCmd: (url: string) => `install docket from ${url}`,
    installJson: (url: string) =>
      `{\n  "mcpServers": {\n    "docket": {\n      "url": "${url}",\n      "headers": {\n        "Authorization": "Bearer YOUR_MCP_API_KEY"\n      }\n    }\n  }\n}`,
  },
  search: { placeholder: "search ideas, apps, MCPs & skills…", go: "Search" },
  terminal: {
    title: "you → your agent → docket",
    install: `{\n  "mcpServers": {\n    "docket": {\n      "url": "https://rundocket.xyz/mcp",\n      "headers": {\n        "Authorization": "Bearer YOUR_MCP_API_KEY"\n      }\n    }\n  }\n}`,
    publish: "publish my idea about an offline habit tracker",
    publishOut: "shift-copilot live → open to build",
    find: "find me a Supabase MCP",
    findOut: "supabase-mcp · connect now",
    check: "check my ideas",
    checkOut: "1 claimed · 1 shipped",
  },
  cats: { label: "Choose where to look", labelHint: "· live counts" },
  catNames: {
    all: "Everything",
    idea: "Ideas",
    app: "Apps",
    mcp: "MCPs",
    skill: "Skills",
  },
  catDescs: {
    all: "Ideas, apps, MCPs and skills in one open index.",
    idea: "Unbuilt thoughts waiting for a builder. Publish one, or find yours.",
    app: "Built products. Click any card to open the maker's site.",
    mcp: "Servers any agent can connect to. Open the repo to install.",
    skill: "Agent skills. Load one into your agent.",
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
  feedback: {
    tab: "Your note",
    title: "Shape the next docket.",
    lede:
      `Spot a gap, want a new kind, or think something should work differently? Drop a note — it goes ` +
      `straight to the maker's desk, not the public board. Read privately, top asks decide what ships next.`,
    placeholder: "What should docket do better? e.g. “I want a devtools category”…",
    kinds: ["General", "Ideas", "Apps", "MCPs", "Skills"],
    contactPlaceholder: "Your handle / email (optional)",
    send: "Send to the docket →",
    sending: "sending…",
    success: "noted ✓ — it's on the maker's desk and up for the next build.",
    note2: "your agent can do it too · a feedback verb is live on /mcp",
  },
  footer: {
    tag: `The open index across ideas, apps, MCPs & skills — for builders and their agents.`,
    browse: {
      label: "Browse",
      links: [
        { label: "The board", href: "#board" },
        { label: "Categories", href: "#explore" },
        { label: "Publish", href: "#", action: "publish" },
        { label: "Leave feedback", href: "#feedback" },
      ],
    },
    agents: {
      label: "For agents",
      links: [
        { label: "/mcp", href: `https://${SITE.domain}/mcp` },
        { label: "llms.txt", href: "/llms.txt" },
      ],
    },
    legal: {
      label: "docket",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
      ],
    },
    legalLine: "© 2026 docket — built for builders & their agents",
    heart: "❤️",
    creditHandle: "@naumanmehdi",
    creditUrl: "https://x.com/NaumanMehdi",
  },
} as const;
