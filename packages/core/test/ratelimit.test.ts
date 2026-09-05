import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, KeyedRateLimiters } from "../src/ratelimit.js";

describe("RateLimiter", () => {
  let l: RateLimiter;
  let now: number;

  beforeEach(() => {
    l = new RateLimiter(1000, 3); // 3 hits / second
    now = 1_000_000;
  });

  it("allows up to max hits within a window", () => {
    for (let i = 0; i < 3; i++) {
      const r = l.check("ip", now);
      expect(r.allowed).toBe(true);
      l.hit("ip", now);
    }
  });

  it("blocks once the window is full and reports retryAfterMs", () => {
    for (let i = 0; i < 3; i++) {
      l.hit("ip", now);
    }
    const blocked = l.check("ip", now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(1000);
  });

  it("is keyed independently", () => {
    l.hit("ip-a", now);
    l.hit("ip-a", now);
    l.hit("ip-a", now);
    // ip-b is unaffected
    expect(l.check("ip-b", now).allowed).toBe(true);
    expect(l.check("ip-a", now).allowed).toBe(false);
  });

  it("frees a window after it expires", () => {
    l.hit("ip", now);
    l.hit("ip", now);
    l.hit("ip", now);
    expect(l.check("ip", now).allowed).toBe(false);
    expect(l.check("ip", now + 1001).allowed).toBe(true);
  });

  it("does not count expired hits", () => {
    l.hit("ip", now); // will expire before now+1001
    const future = now + 1001;
    // allow 3 fresh ones
    for (let i = 0; i < 3; i++) l.hit("ip", future);
    expect(l.check("ip", future).allowed).toBe(false);
    expect(l.check("ip", future + 1).allowed).toBe(false);
  });
});

describe("KeyedRateLimiters", () => {
  it("maintains an independent limiter per named key", () => {
    const k = new KeyedRateLimiters(1000, 1);
    expect(k.for("publish").check("a").allowed).toBe(true);
    k.for("publish").hit("a");
    expect(k.for("publish").check("a").allowed).toBe(false);
    expect(k.for("search").check("a").allowed).toBe(true);
  });
});
