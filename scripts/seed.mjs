// Seed the dev board across all four kinds so the whole app is testable:
// pagination (load-more needs >8 per view), category filters, sub-filters, search.
// Usage: DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
import { createPool, createStore } from "@apprank/core";

// Categories match apps/web/lib/taxonomy.ts (the real shared source).
const APPS = [
  ["AI Agents & Infrastructure", ["AgentScribe", "Turns meetings into notes your agent can act on", "https://agentscribe.dev"]],
  ["AI Agents & Infrastructure", ["PromptCrew", "Orchestrates a team of agents for one task", "https://promptcrew.dev"]],
  ["Developer Tools", ["LaunchPad", "Ships your side project to a live URL in minutes", "https://launchpad.dev"]],
  ["Developer Tools", ["ScriptForge", "Writes, debugs and deploys small scripts", "https://scriptforge.dev"]],
  ["Design & Creative", ["Sketchmate", "Turns rough wireframes into clickable prototypes", "https://sketchmate.app"]],
  ["Design & Creative", ["ColorCraft", "Generates accessible colour palettes in seconds", "https://colorcraft.io"]],
  ["Writing & Content", ["ToneMatch", "Rewrites any text in your brand voice", "https://tonematch.io"]],
  ["Writing & Content", ["QueryGenie", "Answers research questions from your documents", "https://querygenie.ai"]],
  ["Productivity & Personal Tools", ["MindFlow", "Organises your tasks with an AI copilot", "https://mindflow.app"]],
  ["Productivity & Personal Tools", ["FocusFjord", "Deep-work timer with gentle anti-distraction", "https://focusfjord.app"]],
  ["Marketing & Advertising", ["CopyLift", "Writes on-brand copy from a single brief", "https://copylift.ai"]],
  ["Ecommerce & Retail", ["ShopMind", "Personalises storefronts for every visitor", "https://shopmind.ai"]],
  ["AI Media Generation", ["ReelCraft", "Edits short clips into platform-ready reels", "https://reelcraft.app"]],
  ["Health, Fitness & Wellness", ["FuelLog", "Calorie tracking from a photo of your food", "https://fuellog.ai"]],
];

const MCPS = [
  ["Database", ["supabase-mcp", "Query & manage your Postgres/Supabase projects from any agent", "https://github.com/supabase-community/supabase-mcp"]],
  ["Database", ["redis-mcp", "Inspect and query Redis from your agent", "https://github.com/example/redis-mcp"]],
  ["Communication", ["slack-mcp", "Send and read Slack messages agent-side", "https://github.com/example/slack-mcp"]],
  ["Memory & Knowledge", ["notion-mcp", "Read and write Notion pages from any agent", "https://github.com/example/notion-mcp"]],
  ["File & Storage", ["s3-mcp", "Upload and fetch files in S3-compatible storage", "https://github.com/example/s3-mcp"]],
  ["Browser & Web", ["context-dev", "Scrape any URL to clean markdown for agents", "https://context.dev"]],
  ["Payments", ["stripe-mcp", "Create payments and parse webhooks", "https://github.com/example/stripe-mcp"]],
  ["Observability & Logging", ["posthog-mcp", "Query product analytics events", "https://github.com/example/posthog-mcp"]],
];

const SKILLS = [
  ["Coding & Engineering", ["pr-reviewer", "Reviews pull requests for bugs and style", "https://example.com/pr-reviewer"]],
  ["Writing & Content", ["copy-craft", "Turns rough notes into polished marketing copy", "https://example.com/copy-craft"]],
  ["Research & Analysis", ["research-deep", "Pulls cited sources and writes a brief", "https://example.com/research-deep"]],
  ["Marketing & Growth", ["seo-audit", "Checks a page and lists SEO fixes", "https://example.com/seo-audit"]],
  ["Data & Analytics", ["data-wrangler", "Cleans and explores a messy dataset", "https://example.com/data-wrangler"]],
  ["Sales & CRM", ["stripe-skills", "Official Stripe payments skills for coding agents", "https://github.com/Stripe/agent-toolkit"]],
];

const IDEAS = [
  ["Shift-copilot", "Offline-first habit tracker built for night-shift workers", "Most habit apps assume a 9-5. Built around rotating shifts — plan on-device, sync when possible.", "idea_owner"],
  ["Meeting-wallet", "Turn every meeting note into a spendable token", "The notes you already write become a knowledge currency you can trade or gift.", "naumanmehdi"],
  ["Auto-budgeter", "Categorises spend and nudges before you overspend", "Plugs into your bank feed and gently warns before a budget is blown.", "budget_nerd"],
];

const pool = createPool(process.env.DATABASE_URL ?? "");
const store = createStore(pool);
const ids = [];

// apps / mcps / skills: rows are [category, [name, tagline, url]]
for (const [category, [name, tagline, url]] of APPS)
  { const row = await store.insertListing({ kind: "app", name, tagline, url, category, author: name.toLowerCase() }); ids.push(row.id); }
for (const [category, [name, tagline, url]] of MCPS)
  { const row = await store.insertListing({ kind: "mcp", name, tagline, url, repo_url: url, category, author: "supabase" }); ids.push(row.id); }
for (const [category, [name, tagline, url]] of SKILLS)
  { const row = await store.insertListing({ kind: "skill", name, tagline, url, repo_url: url, category, author: "skillfolk" }); ids.push(row.id); }
// ideas: [name, tagline, description, author]
for (const [name, tagline, description, author] of IDEAS)
  { const row = await store.insertListing({ kind: "idea", name, tagline, description, author }); ids.push(row.id); }

// Spotlight a handful (hand-picked, D7) so the curated feel shows.
const spotlightNames = ["Shift-copilot", "AgentScribe", "supabase-mcp", "stripe-skills"];
await pool.query(
  "update listings set spotlighted = true where name = any($1::text[]) and kind <> 'idea'",
  [spotlightNames]
);

console.log(`\nseeded ${ids.length} listings total`);
await pool.end();
console.log("done");
