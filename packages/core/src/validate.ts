// Validation for the agent-first catalog (SPEC §6). Single source of truth for
// listing rules — shared by the MCP server, the web form, and the data layer.

export type Kind = "idea" | "app" | "mcp" | "skill";

export const KINDS: Kind[] = ["idea", "app", "mcp", "skill"];

export interface ListingInput {
  kind: Kind;
  name: string;
  tagline: string;
  description?: string | null;
  /** Required for app/mcp/skill; optional for idea (an unbuilt thought). */
  url?: string | null;
  repo_url?: string | null;
  category?: string | null;
  author: string;
  author_contact?: string | null;
  x_handle?: string | null;
}

export type Validation =
  | { ok: true; value: ListingInput }
  | { ok: false; errors: string[] };

const NAME_MAX = 80;
const TAGLINE_MAX = 140;
const CATEGORY_MAX = 60;
const HANDLE_MAX = 50;
const URL_MAX = 2048;
const DESC_MAX = 2000;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns true when the kind is a "built" artifact that needs a resolvable URL. */
export function kindNeedsUrl(kind: Kind): boolean {
  return kind === "app" || kind === "mcp" || kind === "skill";
}

/** Validates a plain http(s) URL; returns the normalized url or "" when invalid. */
function validHttpUrl(value: string): string {
  if (!value) return "";
  if (value.length > URL_MAX) return "";
  try {
    const parsed = new URL(value);
    if (!parsed.hostname) return "";
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    if (parsed.username || parsed.password) return "";
    return value;
  } catch {
    return "";
  }
}

/** Validates + normalizes an identity handle (X/GitHub style) or returns "" when empty. */
export function validHandle(value: string): string {
  const stripped = value.replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,50}$/.test(stripped) ? stripped : "";
}

export function validateListing(raw: unknown): Validation {
  const errors: string[] = [];
  const o = (raw ?? {}) as Record<string, unknown>;

  const kindRaw = clean(o.kind);
  const kind: Kind = (KINDS as string[]).includes(kindRaw) ? (kindRaw as Kind) : "idea";
  if (!kindRaw) errors.push("kind is required (idea, app, mcp or skill)");
  else if (!(KINDS as string[]).includes(kindRaw))
    errors.push("kind must be one of: idea, app, mcp, skill");

  const name = clean(o.name);
  const tagline = clean(o.tagline);
  const description = clean(o.description) || null;
  const url = clean(o.url);
  const repoUrl = clean(o.repo_url) || null;
  const category = clean(o.category) || null;
  const authorRaw = clean(o.author);
  const authorContact = clean(o.author_contact) || null;
  const xHandleRaw = clean(o.x_handle);

  if (!name) errors.push("name is required");
  else if (name.length > NAME_MAX) errors.push(`name must be ${NAME_MAX} characters or fewer`);

  if (!tagline) errors.push("tagline is required");
  else if (tagline.length > TAGLINE_MAX)
    errors.push(`tagline must be ${TAGLINE_MAX} characters or fewer`);

  if (description && description.length > DESC_MAX)
    errors.push(`description must be ${DESC_MAX} characters or fewer`);

  let urlValue: string | null = null;
  if (kindNeedsUrl(kind)) {
    if (!url) errors.push("url is required for an app, mcp or skill");
    else {
      urlValue = validHttpUrl(url);
      if (!urlValue) errors.push("url must be a valid http(s) address");
    }
  } else if (url) {
    urlValue = validHttpUrl(url);
    if (!urlValue) errors.push("url must be a valid http(s) address");
  }

  if (repoUrl) {
    if (validHttpUrl(repoUrl) === "") errors.push("repo_url must be a valid http(s) address");
  }

  if (category && category.length > CATEGORY_MAX)
    errors.push(`category must be ${CATEGORY_MAX} characters or fewer`);

  if (!authorRaw) errors.push("author is required (a handle so the listing has an owner)");
  else if (authorRaw.length > HANDLE_MAX)
    errors.push(`author must be ${HANDLE_MAX} characters or fewer`);

  let xHandle: string | null = null;
  if (xHandleRaw) {
    const h = validHandle(xHandleRaw);
    if (!h) errors.push(`x_handle must be letters, numbers or underscores (max ${HANDLE_MAX})`);
    else xHandle = h;
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      kind,
      name,
      tagline,
      description,
      url: urlValue,
      repo_url: repoUrl,
      category,
      author: authorRaw,
      author_contact: authorContact,
      x_handle: xHandle,
    },
  };
}
