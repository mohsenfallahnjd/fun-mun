import { type NextRequest, NextResponse } from "next/server";
import { getCachedExploreItem } from "@/lib/explore-cache";
import { parseExploreType } from "@/lib/explore-catalog";
import { normalizeExploreId } from "@/lib/explore-id";

export const revalidate = 3600;

type RouteParams = { params: Promise<{ type: string; id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { type: typeParam, id } = await params;
  const type = parseExploreType(typeParam);

  if (!type) {
    return NextResponse.json({ error: "Invalid category" }, { status: 404 });
  }

  try {
    const item = await getCachedExploreItem(type, normalizeExploreId(id));
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item, type });
  } catch {
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}
