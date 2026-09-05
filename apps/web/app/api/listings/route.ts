import { NextResponse } from "next/server";
import { validateListing, RateLimiter } from "@apprank/core";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// Publish-now is intentional (D7), but a public write endpoint still needs a
// spam brake: cap submissions per client IP. In-memory is fine for a single
// instance / low-traffic MVP; swap for a shared store when scaled out.
const PUBLISH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PUBLISH_MAX = 5; // 5 submissions per IP per window
const publishLimiter = new RateLimiter(PUBLISH_WINDOW_MS, PUBLISH_MAX);

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const gate = publishLimiter.check(ip);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        errors: ["Too many submissions. Please wait a few minutes and try again."],
        retry_after_ms: gate.retryAfterMs,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON body"] }, { status: 400 });
  }

  const validated = validateListing(body);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, errors: validated.errors }, { status: 400 });
  }

  try {
    const listing = await getStore().insertListing(validated.value);
    publishLimiter.hit(ip);
    return NextResponse.json(
      {
        ok: true,
        listing: {
          id: listing.id,
          kind: listing.kind,
          name: listing.name,
          status: listing.status,
          url: listing.url,
          author: listing.author,
          claim_state: listing.claim_state,
          created_at: listing.created_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("listings POST failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}
