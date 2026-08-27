import { NextResponse } from "next/server";
import { validateEmail } from "@apprank/core";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON body"] }, { status: 400 });
  }

  const email = validateEmail((body as { email?: unknown })?.email);
  if (!email.ok) {
    return NextResponse.json({ ok: false, errors: email.errors }, { status: 400 });
  }

  try {
    const sub = await getStore().insertSubscriber(email.value);
    return NextResponse.json(
      { ok: true, subscriber: { id: sub.id, email: sub.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error("subscribe POST failed", err);
    return NextResponse.json({ ok: false, errors: ["internal error"] }, { status: 500 });
  }
}
