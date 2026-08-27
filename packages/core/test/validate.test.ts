import { describe, it, expect } from "vitest";
import { validateListing, validateEmail } from "../src/validate.js";

const base = {
  name: "AgentScribe",
  url: "https://agentscribe.dev",
  tagline: "Turns meetings into notes",
  category: "Productivity",
};

describe("validateListing", () => {
  it("accepts a valid minimal listing", () => {
    const r = validateListing(base);
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.name).toBe("AgentScribe");
  });

  it("rejects a missing name", () => {
    const r = validateListing({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    expect(r.ok ? [] : r.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("rejects a name longer than 80 chars", () => {
    const r = validateListing({ ...base, name: "x".repeat(81) });
    expect(r.ok).toBe(false);
  });

  it("rejects a missing tagline", () => {
    const r = validateListing({ ...base, tagline: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects a tagline longer than 140 chars", () => {
    const r = validateListing({ ...base, tagline: "y".repeat(141) });
    expect(r.ok).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const r = validateListing({ ...base, url: "not-a-url" });
    expect(r.ok).toBe(false);
  });

  it("rejects a non-http(s) URL", () => {
    const r = validateListing({ ...base, url: "ftp://example.com" });
    expect(r.ok).toBe(false);
  });

  it("rejects a missing category", () => {
    const r = validateListing({ ...base, category: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects a category longer than 60 chars", () => {
    const r = validateListing({ ...base, category: "z".repeat(61) });
    expect(r.ok).toBe(false);
  });

  it("rejects an x_handle with invalid characters", () => {
    const r = validateListing({ ...base, x_handle: "hello world" });
    expect(r.ok).toBe(false);
  });

  it("normalizes x_handle by stripping a leading @", () => {
    const r = validateListing({ ...base, x_handle: "@naumanmehdi" });
    expect(r.ok && r.value.x_handle).toBe("naumanmehdi");
  });

  it("accepts a valid bare x_handle without @", () => {
    const r = validateListing({ ...base, x_handle: "naumanmehdi" });
    expect(r.ok && r.value.x_handle).toBe("naumanmehdi");
  });

  it("trims surrounding whitespace from fields", () => {
    const r = validateListing({ ...base, name: "  AgentScribe  ", url: "  https://agentscribe.dev  " });
    expect(r.ok && r.value.name).toBe("AgentScribe");
    expect(r.ok && r.value.url).toBe("https://agentscribe.dev");
  });

  it("collects multiple errors at once", () => {
    const r = validateListing({ name: "", url: "x", tagline: "", category: "" });
    expect(r.ok).toBe(false);
    expect(r.ok ? 0 : r.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe("validateEmail", () => {
  it("accepts a normal email", () => {
    expect(validateEmail("builder@example.com").ok).toBe(true);
  });

  it("rejects garbage", () => {
    expect(validateEmail("not-an-email").ok).toBe(false);
  });

  it("rejects empty", () => {
    expect(validateEmail("").ok).toBe(false);
  });

  it("normalizes by trimming and lowercasing", () => {
    const r = validateEmail("  Builder@Example.COM ");
    expect(r.ok && r.value).toBe("builder@example.com");
  });
});
