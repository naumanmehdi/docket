import type { Listing } from "@docket/core";

// ---------------------------------------------------------------------------
// LISTING ROW — serializable shape passed from the server page to client
// components. Kept flat + plain (JSON-safe) so a client component (Board /
// Catalog) can render + filter without touching the server. Map a core
// `Listing` here; components never import core types directly.
// ---------------------------------------------------------------------------
export interface ListingRow {
  id: string;
  kind: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string | null;
  repo_url: string | null;
  category: string | null;
  author: string;
  x_handle: string | null;
  status: string;
  spotlighted: boolean;
  claim_state: string | null;
  claimed_by: string | null;
  build_url: string | null;
  created_at: string;
}

export function toRow(l: Listing): ListingRow {
  return {
    id: l.id,
    kind: l.kind,
    name: l.name,
    tagline: l.tagline,
    description: l.description,
    url: l.url,
    repo_url: l.repo_url,
    category: l.category,
    author: l.author,
    x_handle: l.x_handle,
    status: l.status,
    spotlighted: l.spotlighted,
    claim_state: l.claim_state,
    claimed_by: l.claimed_by,
    build_url: l.build_url,
    created_at: l.created_at.toISOString(),
  };
}

/** Primary outbound link for a built listing (its own url, else repo). Ideas (null) stay unlinked. */
export function listingHref(row: ListingRow): string | null {
  return row.build_url ?? row.url ?? row.repo_url;
}

/** Short headline shown on a card: the tagline for built kinds, the pitch for ideas. */
export function cardHeadline(row: ListingRow): string {
  return row.tagline;
}

// Stable per-name logo color (no hash-flash across renders).
const LOGO_COLORS = ["#4fae8e", "#e8622d", "#d9a441", "#c78fd6", "#e89b76", "#7fb7a0"];
export function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LOGO_COLORS[h % LOGO_COLORS.length]!;
}
