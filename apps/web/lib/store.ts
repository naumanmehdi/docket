import "server-only";
import { createPool, createStore, type Store } from "@apprank/core";

// Server-only, lazy singleton store backed by DATABASE_URL (Supabase in prod,
// local Postgres in dev). The exact same store the MCP server writes to.
let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = createPool(databaseUrl);
  cached = createStore(pool);
  return cached;
}
