import { type NextRequest, NextResponse } from "next/server";
import { mergeItemLists } from "@/lib/items-mapper";
import { listUserItems, replaceUserItems } from "@/lib/items-service";
import type { LeisureItem } from "@/lib/types";

function dbUnavailable() {
  return NextResponse.json({ error: "Database not configured" }, { status: 503 });
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const body = (await request.json()) as { items?: LeisureItem[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const existing = await listUserItems();
    const merged = mergeItemLists(body.items, existing);

    const items = await replaceUserItems(merged);
    return NextResponse.json({ items, migrated: body.items.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/profile/migrate failed:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
