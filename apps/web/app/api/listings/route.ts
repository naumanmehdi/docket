import { NextResponse } from "next/server";
import { validateListing } from "@apprank/core";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    return NextResponse.json(
      {
        ok: true,
        listing: {
          id: listing.id,
          name: listing.name,
          status: listing.status,
          url: listing.url,
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
