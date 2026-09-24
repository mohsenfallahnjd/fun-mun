import { tmdbFetch } from "@/lib/tmdb";
import type { LeisureItem } from "@/lib/types";

const tmdbGenres: Record<number, string[]> = {
  28: ["action"],
  12: ["adventure"],
  16: ["animation"],
  35: ["comedy"],
  80: ["crime"],
  99: ["documentary"],
  18: ["drama"],
  10751: ["family"],
  14: ["fantasy"],
  36: ["history"],
  27: ["horror"],
  10402: ["music"],
  9648: ["mystery"],
  10749: ["romance"],
  878: ["sci-fi"],
  53: ["thriller"],
  10752: ["war"],
  37: ["western"],
  10759: ["action", "adventure"],
  10762: ["kids"],
  10765: ["sci-fi", "fantasy"],
  10768: ["war", "politics"],
};

type TmdbSearch = { results?: { genre_ids?: number[] }[] };

/** Genres for movies and series via TMDB search; empty when unknown or TMDB isn't configured. */
export async function lookupGenres(item: LeisureItem): Promise<string[]> {
  if (item.type !== "movie" && item.type !== "series") return [];
  const kind = item.type === "movie" ? "movie" : "tv";
  const params: Record<string, string> = { query: item.originalTitle || item.title };
  if (item.year) params[kind === "movie" ? "year" : "first_air_date_year"] = String(item.year);

  try {
    const res = await tmdbFetch(`search/${kind}`, params);
    if (!res?.ok) return [];
    const data = (await res.json()) as TmdbSearch;
    const ids = data.results?.[0]?.genre_ids ?? [];
    return [...new Set(ids.flatMap((id) => tmdbGenres[id] ?? []))];
  } catch {
    return [];
  }
}
