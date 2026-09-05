import { describe, it, expect } from "vitest";
import { validateListing } from "../src/validate.js";

const base = {
  kind: "app",
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  author: "naumanmehdi",
};

describe("validateListing — kind", () => {
  it("accepts a valid minimal app", () => {
    const r = validateListing(base);
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.kind).toBe("app");
  });

  it("accepts each of the four kinds", () => {
    for (const kind of ["idea", "app", "mcp", "skill"]) {
      const r = validateListing({ ...base, kind });
      expect(r.ok).toBe(true);
    }
  });

  it("rejects a missing kind", () => {
    const { kind, ...rest } = base as Record<string, unknown>;
    const r = validateListing(rest);
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const r = validateListing({ ...base, kind: "plugin" });
    expect(r.ok).toBe(false);
  });
});

describe("validateListing — url is kind-dependent", () => {
  it("accepts an idea with NO url (the unbuilt thought)", () => {
    const r = validateListing({ ...base, kind: "idea", url: "" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.url).toBeNull();
  });

  it("rejects an app with no url", () => {
    const r = validateListing({ ...base, kind: "app", url: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects an mcp with no url", () => {
    const r = validateListing({ ...base, kind: "mcp", url: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects a skill with no url", () => {
    const r = validateListing({ ...base, kind: "skill", url: "" });
    expect(r.ok).toBe(false);
  });

  it("accepts an idea that does include a url", () => {
    const r = validateListing({ ...base, kind: "idea", url: "https://example.com" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.url).toBe("https://example.com");
  });

  it("rejects a non-http(s) url", () => {
    const r = validateListing({ ...base, url: "ftp://example.com" });
    expect(r.ok).toBe(false);
  });

  it("rejects a url with embedded credentials", () => {
    const r = validateListing({ ...base, url: "https://user:pass@example.com" });
    expect(r.ok).toBe(false);
  });

  it("rejects an over-long url", () => {
    const r = validateListing({ ...base, url: `https://example.com/${"a".repeat(2100)}` });
    expect(r.ok).toBe(false);
  });
});

describe("validateListing — author identity (moderation)", () => {
  it("rejects a missing author", () => {
    const { author, ...rest } = base as Record<string, unknown>;
    const r = validateListing(rest);
    expect(r.ok).toBe(false);
  });

  it("rejects an over-long author", () => {
    const r = validateListing({ ...base, author: "x".repeat(51) });
    expect(r.ok).toBe(false);
  });
});

describe("validateListing — field rules", () => {
  it("rejects a missing name", () => {
    const r = validateListing({ ...base, name: "   " });
    expect(r.ok).toBe(false);
  });

  it("rejects a name longer than 80 chars", () => {
    const r = validateListing({ ...base, name: "x".repeat(81) });
    expect(r.ok).toBe(false);
  });

  it("rejects a missing tagline", () => {
    const r = validateListing({ ...base, tagline: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects a description longer than 2000 chars", () => {
    const r = validateListing({ ...base, description: "y".repeat(2001) });
    expect(r.ok).toBe(false);
  });

  it("rejects a bad repo_url", () => {
    const r = validateListing({ ...base, repo_url: "not-a-url" });
    expect(r.ok).toBe(false);
  });

  it("accepts a repo_url", () => {
    const r = validateListing({ ...base, repo_url: "https://github.com/a/b" });
    expect(r.ok).toBe(true);
  });

  it("normalizes x_handle by stripping a leading @", () => {
    const r = validateListing({ ...base, x_handle: "@naumanmehdi" });
    expect(r.ok && r.value.x_handle).toBe("naumanmehdi");
  });

  it("rejects an x_handle with invalid characters", () => {
    const r = validateListing({ ...base, x_handle: "hello world" });
    expect(r.ok).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    const r = validateListing({ ...base, name: "  AgentScribe  ", url: "  https://agentscribe.dev  " });
    expect(r.ok && r.value.name).toBe("AgentScribe");
    expect(r.ok && r.value.url).toBe("https://agentscribe.dev");
  });

  it("collects multiple errors at once", () => {
    const r = validateListing({ name: "", tagline: "", author: "" });
    expect(r.ok).toBe(false);
    expect(r.ok ? 0 : r.errors.length).toBeGreaterThanOrEqual(3);
  });
});
