import { rawgRating } from "./rating";
import type { SearchResult } from "./types";
import { cleanGameTitle, isWikiVideoGameArticle, yearFromGameDescription } from "./wiki-games";

export async function searchGamesRawg(q: string, apiKey: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ search: q, page_size: "8", key: apiKey });
  const res = await fetch(`https://api.rawg.io/api/games?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      released?: string;
      background_image?: string;
      slug?: string;
      rating?: number;
      metacritic?: number | null;
    }>;
  };

  return (data.results ?? []).map((game) => {
    const year = game.released ? parseInt(game.released.slice(0, 4), 10) : undefined;
    return {
      id: String(game.id),
      title: game.name,
      imageUrl: game.background_image,
      year: Number.isNaN(year) ? undefined : year,
      sourceUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
      rating: rawgRating(game.rating, game.metacritic),
    };
  });
}

export async function searchGamesWikipedia(q: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${q} video game`,
    gsrlimit: "8",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "300",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "FunMun/1.0" },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid?: number;
          title?: string;
          description?: string;
          thumbnail?: { source?: string };
        }
      >;
    };
  };

  return Object.entries(data.query?.pages ?? {}).flatMap(([pageId, page]) => {
    if (!page.title || !isWikiVideoGameArticle(page.title, page.description)) return [];
    const slug = page.title.replace(/ /g, "_");
    return [
      {
        id: String(page.pageid ?? pageId),
        title: cleanGameTitle(page.title),
        subtitle: page.description?.slice(0, 120),
        imageUrl: page.thumbnail?.source,
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
        year: yearFromGameDescription(page.description),
      },
    ];
  });
}

export async function searchGames(q: string): Promise<{
  results: SearchResult[];
  hint?: "missing_rawg_key" | "no_results";
}> {
  const key = process.env.RAWG_API_KEY;
  if (key) {
    const results = await searchGamesRawg(q, key);
    if (results.length > 0) return { results };
  }

  const fallback = await searchGamesWikipedia(q);
  if (fallback.length > 0) return { results: fallback };
  if (!key) return { results: [], hint: "missing_rawg_key" };
  return { results: [], hint: "no_results" };
}
