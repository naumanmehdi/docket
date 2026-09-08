import "server-only";
import {
  createPool,
  createStore,
  createAccessStore,
  type Store,
  type AccessStore,
} from "@docket/core";

// Server-only, lazy singleton store backed by DATABASE_URL (Supabase in prod,
// local Postgres in dev). The exact same store the MCP server writes to.
let cached: Store | null = null;
let cachedAccess: AccessStore | null = null;
let cachedPool: ReturnType<typeof createPool> | null = null;

function pool(): ReturnType<typeof createPool> {
  if (cachedPool) return cachedPool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  cachedPool = createPool(databaseUrl);
  return cachedPool;
}

export function getStore(): Store {
  if (cached) return cached;
  cached = createStore(pool());
  return cached;
}

/** Per-identity access store (invite codes, keys, rate limits) — same DB. */
export function getAccessStore(): AccessStore {
  if (cachedAccess) return cachedAccess;
  cachedAccess = createAccessStore(pool());
  return cachedAccess;
}
