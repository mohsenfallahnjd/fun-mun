import { type NextRequest, NextResponse } from "next/server";
import { searchMovies, searchSeries } from "@/lib/search-media";
import type { SearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const type = request.nextUrl.searchParams.get("type") ?? "movie";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] } satisfies SearchResponse);
  }

  try {
    const results = type === "series" ? await searchSeries(q) : await searchMovies(q);

    return NextResponse.json({
      results,
      hint: results.length === 0 ? "no_results" : undefined,
    } satisfies SearchResponse);
  } catch {
    return NextResponse.json({ results: [], hint: "no_results" } satisfies SearchResponse);
  }
}
