import { type NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/search-books";
import { searchGames } from "@/lib/search-games";
import { searchMovies, searchSeries } from "@/lib/search-media";
import type { TypedSearchResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [bookResults, movieResults, seriesResults, gamesData] = await Promise.all([
      searchBooks(q, 4),
      searchMovies(q),
      searchSeries(q),
      searchGames(q),
    ]);

    const books: TypedSearchResult[] = bookResults.map((r) => ({
      ...r,
      type: "book" as const,
    }));

    const movies: TypedSearchResult[] = movieResults.slice(0, 3).map((r) => ({
      ...r,
      type: "movie" as const,
    }));
    const series: TypedSearchResult[] = seriesResults.slice(0, 3).map((r) => ({
      ...r,
      type: "series" as const,
    }));
    const games: TypedSearchResult[] = gamesData.results.map((r) => ({
      ...r,
      type: "game" as const,
    }));

    const results = [...books, ...movies, ...series, ...games].slice(0, 12);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
