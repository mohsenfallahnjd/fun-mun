import { tmdbRating, tvmazeRating } from "./rating";
import { resolveDisplayTitle } from "./titles";
import { hasTmdbKey, tmdbFetch, tmdbPosterUrl } from "./tmdb";
import type { SearchResult } from "./types";

const FETCH_INIT: RequestInit = { cache: "no-store" };
const UA = { "User-Agent": "FunMun/1.0 (https://github.com/fun-mun)" };

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function yearFromDate(date?: string): number | undefined {
  if (!date) return undefined;
  const year = parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? undefined : year;
}

async function searchMoviesTmdb(q: string): Promise<SearchResult[]> {
  try {
    const res = await tmdbFetch("search/movie", { query: q });
    if (!res?.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      title?: string;
      original_title?: string;
      original_language?: string;
      overview?: string;
      poster_path?: string | null;
      release_date?: string;
      vote_average?: number;
    }>;
  };

  return (data.results ?? []).slice(0, 8).map((item) => {
    const resolved = resolveDisplayTitle(
      item.title ?? "Unknown",
      item.original_title,
      item.original_language,
    );
    return {
      id: String(item.id),
      title: resolved.title,
      originalTitle: resolved.originalTitle,
      subtitle: item.overview?.slice(0, 120),
      imageUrl: tmdbPosterUrl(item.poster_path),
      year: yearFromDate(item.release_date),
      sourceUrl: `https://www.themoviedb.org/movie/${item.id}`,
      rating: tmdbRating(item.vote_average),
    };
  });
  } catch {
    return [];
  }
}

async function searchSeriesTmdb(q: string): Promise<SearchResult[]> {
  try {
    const res = await tmdbFetch("search/tv", { query: q });
    if (!res?.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name?: string;
      original_name?: string;
      original_language?: string;
      overview?: string;
      poster_path?: string | null;
      first_air_date?: string;
      vote_average?: number;
    }>;
  };

  return (data.results ?? []).slice(0, 8).map((item) => {
    const resolved = resolveDisplayTitle(
      item.name ?? "Unknown",
      item.original_name,
      item.original_language,
    );
    return {
      id: String(item.id),
      title: resolved.title,
      originalTitle: resolved.originalTitle,
      subtitle: item.overview?.slice(0, 120),
      imageUrl: tmdbPosterUrl(item.poster_path),
      year: yearFromDate(item.first_air_date),
      sourceUrl: `https://www.themoviedb.org/tv/${item.id}`,
      rating: tmdbRating(item.vote_average),
    };
  });
  } catch {
    return [];
  }
}

async function searchSeriesTvmaze(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`,
      FETCH_INIT,
    );

    if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    score?: number;
    show: {
      id: number;
      name: string;
      summary?: string | null;
      image?: { medium?: string } | null;
      premiered?: string | null;
      url?: string;
      rating?: { average?: number | null };
    };
  }>;

  return data
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8)
    .map(({ show }) => {
      const summary = show.summary ? stripHtml(show.summary) : undefined;
      return {
        id: String(show.id),
        title: show.name,
        subtitle: summary?.slice(0, 120),
        imageUrl: show.image?.medium,
        year: yearFromDate(show.premiered ?? undefined),
        sourceUrl: show.url ?? `https://www.tvmaze.com/shows/${show.id}`,
        rating: tvmazeRating(show.rating?.average),
      };
    });
  } catch {
    return [];
  }
}

async function searchMoviesWikipedia(q: string): Promise<SearchResult[]> {
  try {
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
    ...FETCH_INIT,
    headers: UA,
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

  return Object.values(data.query?.pages ?? {})
    .flatMap((page) => {
      if (!page.title || !page.description?.includes("film")) return [];

      const yearMatch = page.description.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
      const slug = page.title.replace(/ /g, "_");

      return [
        {
          id: slug,
          title: page.title,
          subtitle: page.description.slice(0, 120),
          imageUrl: page.thumbnail?.source,
          year: Number.isNaN(year) ? undefined : year,
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        },
      ];
    })
    .slice(0, 8);
  } catch {
    return [];
  }
}

export async function searchMovies(q: string, limit = 8): Promise<SearchResult[]> {
  if (hasTmdbKey()) {
    const tmdbResults = await searchMoviesTmdb(q);
    if (tmdbResults.length > 0) return tmdbResults.slice(0, limit);
  }

  return (await searchMoviesWikipedia(q)).slice(0, limit);
}

export async function searchSeries(q: string, limit = 8): Promise<SearchResult[]> {
  if (hasTmdbKey()) {
    const tmdbResults = await searchSeriesTmdb(q);
    if (tmdbResults.length > 0) return tmdbResults.slice(0, limit);
  }

  return (await searchSeriesTvmaze(q)).slice(0, limit);
}
