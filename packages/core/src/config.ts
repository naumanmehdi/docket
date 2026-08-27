import { BRAND } from "./brand.js";

export interface Config {
  databaseUrl: string;
  mcpApiKey: string;
  brand: typeof BRAND;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return {
    databaseUrl,
    mcpApiKey: env.MCP_API_KEY ?? "dev-key",
    brand: BRAND,
  };
}
