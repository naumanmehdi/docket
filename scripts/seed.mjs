// Seed a handful of sample listings into the dev DB so the live board has real density.
// Usage: DATABASE_URL=postgres://localhost:5432/apprank node scripts/seed.mjs
import { createPool, createStore } from "@apprank/core";

const samples = [
  { name: "AgentScribe", url: "https://agentscribe.dev", tagline: "Turns meetings into notes", category: "Productivity", x_handle: "agentscribe" },
  { name: "MindFlow", url: "https://mindflow.app", tagline: "Organises your tasks with an AI copilot", category: "Productivity", x_handle: null },
  { name: "ColorCraft", url: "https://colorcraft.io", tagline: "Generates accessible colour palettes in seconds", category: "Design", x_handle: "colorcraft" },
  { name: "QueryGenie", url: "https://querygenie.ai", tagline: "Answers research questions from your documents", category: "Research", x_handle: null },
  { name: "DeployMate", url: "https://deploymate.dev", tagline: "Ship front-ends with one command from your agent", category: "DevOps", x_handle: "deploymate" },
];

const pool = createPool(process.env.DATABASE_URL ?? "");
const store = createStore(pool);

for (const s of samples) {
  const row = await store.insertListing(s);
  console.log(`seeded ${row.name} -> ${row.id} (${row.status})`);
}
await pool.end();
console.log("done");
