// ---------------------------------------------------------------------------
// BRAND — single source of truth for the product name + copy (MVP §6).
// The final name/domain is TBD; swap it HERE and nowhere else.
// ---------------------------------------------------------------------------
export const BRAND = {
  name: "AppRank",
  domain: "apprank.vercel.app",
  handle: "@apprank",
  heroTitle: "Your agent can list your AI tool in 2 minutes",
  heroSub: "AppRank is the directory your agent can use — list for free, appear on the live board instantly, and get found.",
  promise: "Free forever. Rank is earned.",
  tagline: "Money buys the loudspeaker. It never buys the rankings.",
} as const;

export type Brand = typeof BRAND;
