import { NextResponse } from "next/server";
import { RateLimiter, FEEDBACK_MESSAGE_MAX, type FeedbackKind } from "@docket/core";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// Public write endpoint — needs the same spam brake as publish. Private intake
// still lands in the DB, but we don't let anyone flood it.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX = 15; // 15 notes per IP per window
const limiter = new RateLimiter(WINDOW_MS, MAX);

const KINDS: FeedbackKind[] = ["general", "idea", "app", "mcp", "skill"];

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const gate = limiter.check(clientIp(request));
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, errors: ["Too many notes — please wait a few minutes."], retry_after_ms: gate.retryAfterMs },
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
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) {
    return NextResponse.json({ ok: false, errors: ["message is required"] }, { status: 400 });
  }
  if (message.length > FEEDBACK_MESSAGE_MAX) {
    return NextResponse.json({ ok: false, errors: [`message must be ${FEEDBACK_MESSAGE_MAX} chars or fewer`] }, { status: 400 });
  }
  const kind = typeof b.kind === "string" && (KINDS as string[]).includes(b.kind) ? (b.kind as FeedbackKind) : undefined;
  const contact = typeof b.contact === "string" ? b.contact.trim().slice(0, 200) : undefined;

  try {
    const f = await getStore().submitFeedback({ message, kind, contact, source: "web" });
    limiter.hit(clientIp(request));
    return NextResponse.json({ ok: true, id: f.id, at: f.created_at.toISOString() }, { status: 201 });
  } catch (err) {
    console.error("feedback POST failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}