// Simple in-memory sliding-window rate limiter.
// MVP-grade: single-instance only. If the app ever runs multiple instances,
// swap this for a shared store (Redis/Postgres) behind the same interface.
// The publish-now moderation model (D7) still needs a spam brake on public
// write paths — this is that brake.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // hits left in the window
  retryAfterMs: number; // when the window resets (0 when allowed)
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  constructor(
    private readonly windowMs: number,
    private readonly max: number
  ) {}

  /** Prune timestamps older than the window and return how many remain. */
  private prune(key: string, now: number): number[] {
    const cutoff = now - this.windowMs;
    const arr = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    this.hits.set(key, arr);
    return arr;
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const arr = this.prune(key, now);
    if (arr.length >= this.max) {
      // oldest surviving timestamp defines when the window resets
      const oldest = arr[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + this.windowMs - now),
      };
    }
    return { allowed: true, remaining: this.max - arr.length, retryAfterMs: 0 };
  }

  /** Register a hit. Call only when the caller passes check(). */
  hit(key: string, now = Date.now()): void {
    const arr = this.prune(key, now);
    arr.push(now);
    this.hits.set(key, arr);
  }

  reset(key?: string): void {
    if (key) this.hits.delete(key);
    else this.hits.clear();
  }
}

/** A per-key named set of limiters — convenient for one per endpoint. */
export class KeyedRateLimiters {
  private readonly byName = new Map<string, RateLimiter>();
  constructor(
    private readonly windowMs: number,
    private readonly max: number
  ) {}

  for(name: string): RateLimiter {
    let limiter = this.byName.get(name);
    if (!limiter) {
      limiter = new RateLimiter(this.windowMs, this.max);
      this.byName.set(name, limiter);
    }
    return limiter;
  }
}
