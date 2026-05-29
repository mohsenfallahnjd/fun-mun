import { type NextRequest, NextResponse } from "next/server";
import type { SearchResponse, SearchResult } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

async function searchSeriesTvmaze(q: string): Promise<SearchResult[]> {
  const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    show: {
      id: number;
      name: string;
      summary?: string | null;
      image?: { medium?: string } | null;
      premiered?: string | null;
      url?: string;
    };
  }>;

  return data.slice(0, 8).map(({ show }) => {
    const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : undefined;
    const summary = show.summary ? stripHtml(show.summary) : undefined;

    return {
      id: String(show.id),
      title: show.name,
      subtitle: summary?.slice(0, 120),
      imageUrl: show.image?.medium,
      year: Number.isNaN(year) ? undefined : year,
      sourceUrl: show.url,
    };
  });
}

async function searchMoviesWikipedia(q: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${q} film`,
    gsrlimit: "10",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "300",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "FunMun/1.0 (https://github.com/fun-mun)" },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          description?: string;
          thumbnail?: { source?: string };
        }
      >;
    };
  };

  const pages = Object.values(data.query?.pages ?? {});

  return pages
    .flatMap((page) => {
      if (!page.title || !page.description?.includes("film")) return [];
      const title = page.title;
      const yearMatch = page.description.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
      const slug = title.replace(/ /g, "_");

      return [
        {
          id: slug,
          title,
          subtitle: page.description.slice(0, 120),
          imageUrl: page.thumbnail?.source,
          year: Number.isNaN(year) ? undefined : year,
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        },
      ];
    })
    .slice(0, 8);
}

async function searchMoviesTmdb(q: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=en-US`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      title?: string;
      overview?: string;
      poster_path?: string | null;
      release_date?: string;
    }>;
  };

  return (data.results ?? []).slice(0, 8).map((item) => {
    const year = item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : undefined;

    return {
      id: String(item.id),
      title: item.title ?? "Unknown",
      subtitle: item.overview?.slice(0, 120),
      imageUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
      year: Number.isNaN(year) ? undefined : year,
      sourceUrl: `https://www.themoviedb.org/movie/${item.id}`,
    };
  });
}

async function searchSeriesTmdb(q: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=en-US`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name?: string;
      overview?: string;
      poster_path?: string | null;
      first_air_date?: string;
    }>;
  };

  return (data.results ?? []).slice(0, 8).map((item) => {
    const year = item.first_air_date ? parseInt(item.first_air_date.slice(0, 4), 10) : undefined;

    return {
      id: String(item.id),
      title: item.name ?? "Unknown",
      subtitle: item.overview?.slice(0, 120),
      imageUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
      year: Number.isNaN(year) ? undefined : year,
      sourceUrl: `https://www.themoviedb.org/tv/${item.id}`,
    };
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const type = request.nextUrl.searchParams.get("type") ?? "movie";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] } satisfies SearchResponse);
  }

  try {
    const apiKey = process.env.TMDB_API_KEY;

    if (type === "series") {
      const tmdbResults = apiKey ? await searchSeriesTmdb(q, apiKey) : [];
      const results = tmdbResults.length > 0 ? tmdbResults : await searchSeriesTvmaze(q);

      return NextResponse.json({
        results,
        hint: results.length === 0 ? "no_results" : undefined,
      } satisfies SearchResponse);
    }

    const tmdbResults = apiKey ? await searchMoviesTmdb(q, apiKey) : [];
    const results = tmdbResults.length > 0 ? tmdbResults : await searchMoviesWikipedia(q);

    return NextResponse.json({
      results,
      hint: results.length === 0 ? "no_results" : undefined,
    } satisfies SearchResponse);
  } catch {
    return NextResponse.json({ results: [], hint: "no_results" } satisfies SearchResponse);
  }
}
