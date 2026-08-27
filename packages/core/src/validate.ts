export interface ListingInput {
  name: string;
  url: string;
  tagline: string;
  category: string;
  x_handle?: string | null;
}

export type Validation =
  | { ok: true; value: ListingInput }
  | { ok: false; errors: string[] };

export type EmailResult =
  | { ok: true; value: string }
  | { ok: false; errors: string[] };

const NAME_MAX = 80;
const TAGLINE_MAX = 140;
const CATEGORY_MAX = 60;
const HANDLE_MAX = 50;
const URL_MAX = 2048;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateListing(raw: unknown): Validation {
  const errors: string[] = [];
  const o = (raw ?? {}) as Record<string, unknown>;

  const name = clean(o.name);
  const url = clean(o.url);
  const tagline = clean(o.tagline);
  const category = clean(o.category);
  const xHandleRaw = clean(o.x_handle);

  if (!name) errors.push("name is required");
  else if (name.length > NAME_MAX) errors.push(`name must be ${NAME_MAX} characters or fewer`);

  let urlValue = "";
  if (!url) errors.push("url is required");
  else if (url.length > URL_MAX) errors.push(`url must be ${URL_MAX} characters or fewer`);
  else {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      parsed = null;
    }
    if (!parsed || !parsed.hostname) errors.push("url must be a valid web address");
    else if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      errors.push("url must be http(s)");
    else if (parsed.username || parsed.password)
      errors.push("url must not contain embedded credentials");
    else urlValue = url;
  }

  if (!tagline) errors.push("tagline is required");
  else if (tagline.length > TAGLINE_MAX)
    errors.push(`tagline must be ${TAGLINE_MAX} characters or fewer`);

  if (!category) errors.push("category is required");
  else if (category.length > CATEGORY_MAX)
    errors.push(`category must be ${CATEGORY_MAX} characters or fewer`);

  let xHandle: string | null = null;
  if (xHandleRaw) {
    const stripped = xHandleRaw.replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{1,50}$/.test(stripped))
      errors.push(`x_handle must be letters, numbers or underscores (max ${HANDLE_MAX})`);
    else xHandle = stripped;
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, url: urlValue, tagline, category, x_handle: xHandle },
  };
}

export function validateEmail(raw: unknown): EmailResult {
  const email = clean(raw).toLowerCase();
  if (!email) return { ok: false, errors: ["email is required"] };
  if (email.length > 254) return { ok: false, errors: ["email is too long"] };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, errors: ["email is invalid"] };
  return { ok: true, value: email };
}
