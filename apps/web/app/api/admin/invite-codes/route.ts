import { NextResponse } from "next/server";
import type { KeyScope } from "@docket/core";
import { getAccessStore } from "@/lib/store";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InviteStatus = "active" | "maxed" | "expired" | "revoked";

function statusOf(c: {
  revoked: boolean;
  expiresAt: Date | null;
  usedCount: number;
  maxUses: number;
}): InviteStatus {
  if (c.revoked) return "revoked";
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return "expired";
  if (c.usedCount >= c.maxUses) return "maxed";
  return "active";
}

// GET /api/admin/invite-codes — list every code with live usage/status.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const codes = await getAccessStore().listInviteCodes();
  return NextResponse.json(
    codes.map((c) => ({
      id: c.id,
      code: c.code,
      max_uses: c.maxUses,
      used_count: c.usedCount,
      remaining: Math.max(0, c.maxUses - c.usedCount),
      scopes: c.scopes,
      status: statusOf(c),
      expires_at: c.expiresAt ? c.expiresAt.toISOString() : null,
      created_at: c.createdAt.toISOString(),
    }))
  );
}

const SCOPES: KeyScope[] = ["read", "write", "admin"];

// POST /api/admin/invite-codes — mint one or many codes.
// Body: { code?, prefix?, count?, max_uses, scopes?, expires_at? }
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON body"] }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const maxUses = Number(b.max_uses);
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000) {
    return NextResponse.json({ ok: false, errors: ["max_uses must be an integer between 1 and 100000"] }, { status: 400 });
  }

  const scopes = Array.isArray(b.scopes)
    ? (b.scopes.filter((s): s is KeyScope => typeof s === "string" && (SCOPES as string[]).includes(s)) as KeyScope[])
    : undefined;

  const code = typeof b.code === "string" ? b.code.trim() : undefined;
  const prefix = typeof b.prefix === "string" ? b.prefix.trim() : undefined;
  const count = Number(b.count ?? 1);
  const expiresAt = typeof b.expires_at === "string" && b.expires_at ? b.expires_at : null;

  try {
    const created = await getAccessStore().createInviteCodes({
      code,
      prefix,
      count,
      maxUses,
      scopes,
      expiresAt,
    });
    return NextResponse.json(
      {
        ok: true,
        codes: created.map((c) => ({
          id: c.id,
          code: c.code,
          max_uses: c.maxUses,
          scopes: c.scopes,
          expires_at: c.expiresAt ? c.expiresAt.toISOString() : null,
        })),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("admin invite-codes create failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}
