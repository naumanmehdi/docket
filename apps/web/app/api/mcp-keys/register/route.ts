import { NextResponse } from "next/server";
import { RateLimiter } from "@docket/core";
import { getAccessStore } from "@/lib/store";

export const runtime = "nodejs";
// Never pre-render: a live write endpoint.
export const dynamic = "force-dynamic";

// Self-serve registration is public (gated by invite codes), so it still needs a
// spam brake on top of the code limits: cap registrations per IP.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX = 5; // 5 registrations per IP per hour
const limiter = new RateLimiter(WINDOW_MS, MAX);

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const gate = limiter.check(ip);
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, errors: ["Too many registrations. Please try again in a few minutes."], retry_after_ms: gate.retryAfterMs },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON body"] }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const rawCode = b.code ?? b.invite_code;
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  const owner = typeof b.owner === "string" ? b.owner.trim() : "";
  if (!code || !owner) {
    return NextResponse.json(
      { ok: false, errors: ["code and owner are required"] },
      { status: 400 }
    );
  }

  try {
    const result = await getAccessStore().issueKey({ code, owner });
    if (!result.ok) {
      return NextResponse.json({ ok: false, errors: [result.error] }, { status: 400 });
    }
    limiter.hit(ip);
    // The plaintext secret is shown exactly once — it is NOT stored anywhere.
    return NextResponse.json(
      {
        ok: true,
        plaintext: result.plaintext,
        scopes: result.key.scopes,
        owner: result.key.owner,
        created_at: result.key.createdAt.toISOString(),
        note: "Store this key now — it is shown only once. Send it as `Authorization: Bearer <key>` to /mcp.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("mcp-keys/register failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}
