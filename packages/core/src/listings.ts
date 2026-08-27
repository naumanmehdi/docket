import type pg from "pg";
import type { ListingInput } from "./validate.js";

export interface Listing {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: string;
  x_handle: string | null;
  status: "pending" | "live" | "flagged";
  created_at: Date;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: Date;
}

export interface Store {
  insertListing(input: ListingInput): Promise<Listing>;
  getListing(id: string): Promise<Listing | null>;
  listLatest(limit?: number): Promise<Listing[]>;
  insertSubscriber(email: string): Promise<Subscriber>;
}

interface ListingRow {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: string;
  x_handle: string | null;
  status: "pending" | "live" | "flagged";
  created_at: Date;
}

function mapListing(row: ListingRow | undefined): Listing {
  if (!row) throw new Error("expected a listing row");
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    url: row.url,
    category: row.category,
    x_handle: row.x_handle,
    status: row.status,
    created_at: row.created_at,
  };
}

function mapSubscriber(row: { id: string; email: string; created_at: Date } | undefined): Subscriber {
  if (!row) throw new Error("expected a subscriber row");
  return { id: row.id, email: row.email, created_at: row.created_at };
}

export function createStore(pool: pg.Pool): Store {
  return {
    async insertListing(input: ListingInput): Promise<Listing> {
      const { rows } = await pool.query(
        `insert into listings (name, tagline, url, category, x_handle)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [input.name, input.tagline, input.url, input.category, input.x_handle ?? null]
      );
      return mapListing(rows[0]);
    },

    async getListing(id: string): Promise<Listing | null> {
      const { rows } = await pool.query(`select * from listings where id = $1`, [id]);
      return rows[0] ? mapListing(rows[0]) : null;
    },

    async listLatest(limit = 10): Promise<Listing[]> {
      const n = Math.min(Math.max(limit, 1), 50);
      const { rows } = await pool.query(
        `select * from listings where status = 'live'
         order by created_at desc
         limit $1`,
        [n]
      );
      return rows.map(mapListing);
    },

    async insertSubscriber(email: string): Promise<Subscriber> {
      const { rows } = await pool.query(
        `insert into subscribers (email) values ($1)
         on conflict (email) do nothing
         returning *`,
        [email]
      );
      if (rows[0]) return mapSubscriber(rows[0]);
      const { rows: existing } = await pool.query(
        `select * from subscribers where email = $1`,
        [email]
      );
      return mapSubscriber(existing[0]);
    },
  };
}
