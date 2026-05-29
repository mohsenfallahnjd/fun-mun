import { type NextRequest, NextResponse } from "next/server";
import { getCachedExplorePage, getCachedExploreSearch } from "@/lib/explore-cache";
import { parseExploreType } from "@/lib/explore-catalog";

export const revalidate = 3600;

type RouteParams = { params: Promise<{ type: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type: typeParam } = await params;
  const type = parseExploreType(typeParam);

  if (!type) {
    return NextResponse.json({ error: "Invalid category" }, { status: 404 });
  }

  const page = Math.max(
    1,
    Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1,
  );

  const query = request.nextUrl.searchParams.get("q")?.trim();

  try {
    const result =
      query && query.length >= 2
        ? await getCachedExploreSearch(type, query, page)
        : await getCachedExplorePage(type, page);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ items: [], page, hasMore: false }, { status: 500 });
  }
}
