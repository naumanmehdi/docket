// Seed the dev board across all four kinds so it reads alive + curated (SPEC §4).
// Usage: DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
import { createPool, createStore } from "@apprank/core";

const samples = [
  // ideas (unbuilt — the differentiator / "open to build" pool)
  { kind: "idea", name: "Shift-copilot", tagline: "Offline-first habit tracker built for night-shift workers who can't keep a routine", description: "Most habit apps assume a 9-5. This one is designed around rotating shift schedules — plan on-device, sync when possible.", author: "idea_owner", author_contact: "ideaowner@example.com", category: "Health" },
  { kind: "idea", name: "Meeting-wallet", tagline: "Save every meeting note as a spendable 'token' you can trade or gift", description: "Turns the meeting notes you're already writing into a personal knowledge currency. Think browser-history meets a Zettelkasten you can exchange.", author: "naumanmehdi", category: "Productivity" },
  // apps
  { kind: "app", name: "AgentScribe", url: "https://agentscribe.dev", tagline: "Turns meetings into notes your agent can act on", author: "agentscribe", category: "Productivity", x_handle: "agentscribe" },
  // mcp
  { kind: "mcp", name: "Supabase MCP", url: "https://github.com/supabase-community/supabase-mcp", tagline: "Query and manage your Postgres/Supabase projects from any agent", author: "supabase", repo_url: "https://github.com/supabase-community/supabase-mcp", category: "Database" },
  // skills
  { kind: "skill", name: "Stripe Skills", url: "https://github.com/Stripe/agent-toolkit", tagline: "Official Stripe payments skills for coding agents", author: "stripe", repo_url: "https://github.com/Stripe/agent-toolkit", category: "Payments" },
  // a couple more apps to give the board depth
  { kind: "app", name: "MindFlow", url: "https://mindflow.app", tagline: "Organises your tasks with an AI copilot", author: "mindflow", category: "Productivity" },
  { kind: "app", name: "QueryGenie", url: "https://querygenie.ai", tagline: "Answers research questions from your documents", author: "querygenie", category: "Research" },
];

const pool = createPool(process.env.DATABASE_URL ?? "");
const store = createStore(pool);
const ids = [];

for (const s of samples) {
  const row = await store.insertListing(s);
  ids.push(row.id);
  console.log(`seeded ${row.kind}:${row.name} -> ${row.id} (${row.status})`);
}

// Spotlight a couple of the better ones (hand-picked, D7) so the top looks curated.
await pool.query("update listings set spotlighted = true where id = any($1::uuid[])",
  [[ids[0], ids[2], ids[3]]]);
console.log("spotlighted:", ids.length ? "ok" : "none");

await pool.end();
console.log("done");
