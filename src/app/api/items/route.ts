import { type NextRequest, NextResponse } from "next/server";
import { listUserItems, replaceUserItems } from "@/lib/items-service";
import type { LeisureItem } from "@/lib/types";

function dbUnavailable() {
  return NextResponse.json({ error: "Database not configured" }, { status: 503 });
}

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const items = await listUserItems();
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const body = (await request.json()) as { items?: LeisureItem[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const items = await replaceUserItems(body.items);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save items" }, { status: 500 });
  }
}
