import type pg from "pg";
import type { Kind, ListingInput } from "./validate.js";

export type ListingStatus = "pending" | "live" | "flagged" | "removed";
export type ClaimState = "claimed" | "in_progress" | "built" | "abandoned";

export interface Listing {
  id: string;
  kind: Kind;
  name: string;
  tagline: string;
  description: string | null;
  url: string | null;
  repo_url: string | null;
  category: string | null;
  x_handle: string | null;
  author: string;
  author_contact: string | null;
  status: ListingStatus;
  spotlighted: boolean;
  claim_state: ClaimState | null;
  claimed_by: string | null;
  claimed_at: Date | null;
  progress_note: string | null;
  build_url: string | null;
  built_at: Date | null;
  created_at: Date;
}

export interface ClaimLog {
  id: string;
  idea_id: string;
  actor: string;
  action: "claim" | "progress" | "built" | "abandon" | "release";
  detail: string | null;
  created_at: Date;
}

export interface SearchOptions {
  query?: string;
  kind?: Kind;
  /** only unbuilt, unclaimed ideas (the builder "something to build" view) */
  claimableOnly?: boolean;
  limit?: number;
}

export type ClaimResult =
  | { ok: true; listing: Listing; log: ClaimLog }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------
   Feedback (private intake — SEPARATE from the public listings catalog).
   No public board or search reads feedback. Owner-only via admin key or SQL.
   ------------------------------------------------------------------------- */
export type FeedbackKind = "general" | "idea" | "app" | "mcp" | "skill";
export type FeedbackStatus = "new" | "acknowledged" | "triage" | "shipped" | "wontdo" | "spam";

export interface Feedback {
  id: string;
  message: string;
  kind: FeedbackKind;
  contact: string | null;
  status: FeedbackStatus;
  source: "web" | "mcp";
  created_at: Date;
}

export interface TopAsk {
  kind: FeedbackKind;
  bucket: string;
  votes: number;
  last_at: Date;
  sample: string;
}

export const FEEDBACK_KINDS: FeedbackKind[] = ["general", "idea", "app", "mcp", "skill"];
export const FEEDBACK_KIND_DEFAULT: FeedbackKind = "general";
export const FEEDBACK_MESSAGE_MAX = 4000;

export interface Store {
  insertListing(input: ListingInput): Promise<Listing>;
  getListing(id: string): Promise<Listing | null>;
  listLatest(opts?: { limit?: number; kind?: Kind }): Promise<Listing[]>;
  listSpotlight(limit?: number): Promise<Listing[]>;
  searchListings(opts?: SearchOptions): Promise<Listing[]>;
  claimIdea(ideaId: string, actor: string): Promise<ClaimResult>;
  updateClaim(
    ideaId: string,
    actor: string,
    change: { state: "in_progress" | "built"; build_url?: string; progress_note?: string }
  ): Promise<ClaimResult>;
  listIdeaActivity(ideaId: string): Promise<ClaimLog[]>;
  listMyIdeas(actor: string): Promise<Listing[]>;
  /* feedback — private intake + owner digest */
  submitFeedback(input: {
    message: string;
    kind?: FeedbackKind;
    contact?: string;
    source?: "web" | "mcp";
  }): Promise<Feedback>;
  topFeedback(opts?: { limit?: number }): Promise<TopAsk[]>;
}

const ROW_SELECT = `select id, kind, name, tagline, description, url, repo_url, category,
  x_handle, author, author_contact, status, spotlighted,
  claim_state, claimed_by, claimed_at, progress_note, build_url, built_at, created_at
  from listings`;

function mapListing(row: Record<string, unknown> | undefined): Listing {
  if (!row) throw new Error("expected a listing row");
  return {
    id: row.id as string,
    kind: row.kind as Kind,
    name: row.name as string,
    tagline: row.tagline as string,
    description: (row.description as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    repo_url: (row.repo_url as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    x_handle: (row.x_handle as string | null) ?? null,
    author: row.author as string,
    author_contact: (row.author_contact as string | null) ?? null,
    status: row.status as ListingStatus,
    spotlighted: row.spotlighted as boolean,
    claim_state: (row.claim_state as ClaimState | null) ?? null,
    claimed_by: (row.claimed_by as string | null) ?? null,
    claimed_at: (row.claimed_at as Date | null) ?? null,
    progress_note: (row.progress_note as string | null) ?? null,
    build_url: (row.build_url as string | null) ?? null,
    built_at: (row.built_at as Date | null) ?? null,
    created_at: row.created_at as Date,
  };
}

function mapClaimLog(row: Record<string, unknown> | undefined): ClaimLog {
  if (!row) throw new Error("expected a claim_log row");
  return {
    id: row.id as string,
    idea_id: row.idea_id as string,
    actor: row.actor as string,
    action: row.action as ClaimLog["action"],
    detail: (row.detail as string | null) ?? null,
    created_at: row.created_at as Date,
  };
}

function mapFeedback(row: Record<string, unknown> | undefined): Feedback {
  if (!row) throw new Error("expected a feedback row");
  return {
    id: row.id as string,
    message: row.message as string,
    kind: row.kind as FeedbackKind,
    contact: (row.contact as string | null) ?? null,
    status: row.status as FeedbackStatus,
    source: row.source as "web" | "mcp",
    created_at: row.created_at as Date,
  };
}

function mapTopAsk(row: Record<string, unknown> | undefined): TopAsk {
  if (!row) throw new Error("expected a top-ask row");
  return {
    kind: row.kind as FeedbackKind,
    bucket: row.bucket as string,
    votes: (row.votes as number) ?? 0,
    last_at: row.last_at as Date,
    sample: row.sample as string,
  };
}

function clampLimit(value: number | undefined, fallback = 50): number {
  const n = value ?? fallback;
  return Math.min(Math.max(n, 1), 100);
}

/** Max ideas a single builder may hold active (claimed or in_progress) at once (anti-hoarding). */
export const ACTIVE_CLAIM_CAP = 3;

export function createStore(pool: pg.Pool): Store {
  const insertListing = async (input: ListingInput): Promise<Listing> => {
    const { rows } = await pool.query(
      `insert into listings (kind, name, tagline, description, url, repo_url, category,
         x_handle, author, author_contact)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       returning *`,
      [
        input.kind,
        input.name,
        input.tagline,
        input.description ?? null,
        input.url ?? null,
        input.repo_url ?? null,
        input.category ?? null,
        input.x_handle ?? null,
        input.author,
        input.author_contact ?? null,
      ]
    );
    return mapListing(rows[0]);
  };

  const getListing = async (id: string): Promise<Listing | null> => {
    const { rows } = await pool.query(`${ROW_SELECT} where id = $1`, [id]);
    return rows[0] ? mapListing(rows[0]) : null;
  };

  const listLatest = async (opts?: { limit?: number; kind?: Kind }): Promise<Listing[]> => {
    const limit = clampLimit(opts?.limit, 10);
    const args: unknown[] = [limit];
    let where = `status = 'live'`;
    if (opts?.kind) {
      args.push(opts.kind);
      where += ` and kind = $2`;
    }
    const { rows } = await pool.query(
      `${ROW_SELECT} where ${where} order by created_at desc limit $1`,
      args
    );
    return rows.map(mapListing);
  };

  const listSpotlight = async (limit = 6): Promise<Listing[]> => {
    const n = clampLimit(limit, 6);
    const { rows } = await pool.query(
      `${ROW_SELECT} where status = 'live' and spotlighted = true
       order by created_at desc limit $1`,
      [n]
    );
    return rows.map(mapListing);
  };

  const searchListings = async (opts?: SearchOptions): Promise<Listing[]> => {
    const clauses: string[] = [`status = 'live'`];
    const args: unknown[] = [];

    if (opts?.kind) {
      args.push(opts.kind);
      clauses.push(`kind = $${args.length}`);
    }
    if (opts?.query) {
      args.push(`%${opts.query}%`);
      clauses.push(
        `(name ilike $${args.length} or tagline ilike $${args.length}
           or coalesce(description,'') ilike $${args.length}
           or coalesce(category,'') ilike $${args.length})`
      );
    }
    if (opts?.claimableOnly) {
      clauses.push(`kind = 'idea' and (claim_state is null or claim_state = 'abandoned')`);
    }
    args.push(clampLimit(opts?.limit, 25));
    const { rows } = await pool.query(
      `${ROW_SELECT} where ${clauses.join(" and ")}
       order by spotlighted desc, created_at desc limit $${args.length}`,
      args
    );
    return rows.map(mapListing);
  };

  const claimIdea = async (ideaId: string, actor: string): Promise<ClaimResult> => {
    const idea = await getListing(ideaId);
    if (!idea) return { ok: false, error: "idea not found" };
    if (idea.kind !== "idea") return { ok: false, error: "only ideas can be claimed" };
    if (idea.status !== "live") return { ok: false, error: "idea is not live" };
    if (idea.author === actor)
      return { ok: false, error: "you cannot claim your own idea" };
    if (idea.claim_state === "claimed" || idea.claim_state === "in_progress")
      return { ok: false, error: "this idea is already being built" };
    if (idea.claim_state === "built")
      return { ok: false, error: "this idea is already built" };

    const { rows: active } = await pool.query(
      `select count(*)::int as n from listings
       where claimed_by = $1 and claim_state in ('claimed','in_progress')`,
      [actor]
    );
    if ((active[0]?.n as number) >= ACTIVE_CLAIM_CAP)
      return { ok: false, error: `max ${ACTIVE_CLAIM_CAP} active claims` };

    const { rows } = await pool.query(
      `update listings
       set claim_state = 'claimed', claimed_by = $2, claimed_at = now()
       where id = $1 and kind = 'idea'
         and (claim_state is null or claim_state = 'abandoned')
       returning *`,
      [ideaId, actor]
    );
    if (!rows[0]) return { ok: false, error: "idea was claimed by someone else just now" };

    const { rows: logRows } = await pool.query(
      `insert into claim_log (idea_id, actor, action, detail) values ($1,$2,'claim',$3)
       returning *`,
      [ideaId, actor, idea.tagline]
    );
    return { ok: true, listing: mapListing(rows[0]), log: mapClaimLog(logRows[0]) };
  };

  const updateClaim = async (
    ideaId: string,
    actor: string,
    change: { state: "in_progress" | "built"; build_url?: string; progress_note?: string }
  ): Promise<ClaimResult> => {
    const idea = await getListing(ideaId);
    if (!idea) return { ok: false, error: "idea not found" };
    if (idea.claimed_by !== actor)
      return { ok: false, error: "only the builder who claimed this can update it" };

    if (change.state === "built") {
      const buildUrl = (change.build_url ?? "").trim();
      if (!buildUrl)
        return { ok: false, error: "a build_url is required to mark an idea as built" };
      let parsed: URL | null = null;
      try {
        parsed = new URL(buildUrl);
      } catch {
        parsed = null;
      }
      if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:"))
        return { ok: false, error: "build_url must be a valid http(s) address" };
    }

    const cols: string[] = ["claim_state = $2"];
    const args: unknown[] = [ideaId, change.state];
    if (change.progress_note) {
      args.push(change.progress_note);
      cols.push(`progress_note = $${args.length}`);
    }
    if (change.state === "built") {
      args.push(change.build_url!.trim());
      cols.push(`build_url = $${args.length}`, "built_at = now()");
    }
    const { rows } = await pool.query(
      `update listings set ${cols.join(", ")} where id = $1 returning *`,
      args
    );
    if (!rows[0]) return { ok: false, error: "could not update claim" };

    const { rows: logRows } = await pool.query(
      `insert into claim_log (idea_id, actor, action, detail) values ($1,$2,$3,$4) returning *`,
      [
        ideaId,
        actor,
        change.state === "built" ? "built" : "progress",
        change.state === "built" ? change.build_url!.trim() : change.progress_note ?? null,
      ]
    );
    return { ok: true, listing: mapListing(rows[0]), log: mapClaimLog(logRows[0]) };
  };

  const listIdeaActivity = async (ideaId: string): Promise<ClaimLog[]> => {
    const { rows } = await pool.query(
      `select * from claim_log where idea_id = $1 order by created_at asc`,
      [ideaId]
    );
    return rows.map(mapClaimLog);
  };

  const listMyIdeas = async (actor: string): Promise<Listing[]> => {
    const { rows } = await pool.query(
      `${ROW_SELECT} where kind = 'idea' and (author = $1 or claimed_by = $1)
       order by created_at desc`,
      [actor]
    );
    return rows.map(mapListing);
  };

  const submitFeedback = async (input: {
    message: string;
    kind?: FeedbackKind;
    contact?: string;
    source?: "web" | "mcp";
  }): Promise<Feedback> => {
    const kind = input.kind && FEEDBACK_KINDS.includes(input.kind) ? input.kind : FEEDBACK_KIND_DEFAULT;
    const source = input.source === "mcp" ? "mcp" : "web";
    const { rows } = await pool.query(
      `insert into feedback (message, kind, contact, source) values ($1,$2,$3,$4) returning *`,
      [input.message, kind, input.contact?.trim() ? input.contact.trim() : null, source]
    );
    return mapFeedback(rows[0]);
  };

  const topFeedback = async (opts?: { limit?: number }): Promise<TopAsk[]> => {
    const limit = clampLimit(opts?.limit, 12);
    const { rows } = await pool.query(
      `select kind, bucket, votes, last_at, sample from feedback_top_asks limit $1`,
      [limit]
    );
    return rows.map(mapTopAsk);
  };

  return {
    insertListing,
    getListing,
    listLatest,
    listSpotlight,
    searchListings,
    claimIdea,
    updateClaim,
    listIdeaActivity,
    listMyIdeas,
    submitFeedback,
    topFeedback,
  };
}
