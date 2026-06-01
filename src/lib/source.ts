import type { ContentRating } from "./rating";

export interface SourceInput {
  sourceName?: string;
  watchUrl?: string;
  rating?: ContentRating;
  /** Category default, e.g. explore catalog source */
  fallbackSource?: string;
}

const HOST_SOURCES: [RegExp, string][] = [
  [/goodreads\.com/i, "Goodreads"],
  [/imdb\.com/i, "IMDb"],
  [/open\.spotify\.com|spotify\.com/i, "Spotify"],
  [/themoviedb\.org|tmdb\.org/i, "TMDB"],
  [/tvmaze\.com/i, "TVMaze"],
  [/rawg\.io/i, "RAWG"],
  [/openlibrary\.org/i, "Open Library"],
  [/books\.google/i, "Google Books"],
  [/podcasts\.apple|itunes\.apple/i, "Apple Podcasts"],
  [/music\.apple/i, "Apple Music"],
  [/wikipedia\.org|wikimedia\.org/i, "Wikipedia"],
  [/letterboxd\.com/i, "Letterboxd"],
  [/metacritic\.com/i, "Metacritic"],
  [/audible\.com/i, "Audible"],
  [/youtube\.com|youtu\.be/i, "YouTube"],
  [/netflix\.com/i, "Netflix"],
  [/hulu\.com/i, "Hulu"],
  [/disneyplus\.com|disney\.com/i, "Disney+"],
  [/primevideo\.com|amazon\.com/i, "Prime Video"],
  [/nytimes\.com/i, "NYT"],
  [/medium\.com/i, "Medium"],
  [/substack\.com/i, "Substack"],
];

/** Brand-adjacent badge colors — keyed by display label */
export const SOURCE_COLORS: Record<string, string> = {
  Goodreads: "bg-[#553b08]/12 text-[#553b08] dark:bg-[#d4a853]/16 dark:text-[#d4a853]",
  IMDb: "bg-[#9e7700]/12 text-[#9e7700] dark:bg-[#f5c518]/16 dark:text-[#f5c518]",
  Spotify: "bg-[#1a472a]/12 text-[#1a472a] dark:bg-[#1ed760]/16 dark:text-[#1ed760]",
  TMDB: "bg-[#0d253f]/12 text-[#0d253f] dark:bg-[#01b4e4]/16 dark:text-[#01b4e4]",
  TVMaze: "bg-[#3d2f6b]/12 text-[#3d2f6b] dark:bg-[#9b87c4]/16 dark:text-[#9b87c4]",
  RAWG: "bg-[#4a2c2c]/12 text-[#4a2c2c] dark:bg-[#ef4444]/16 dark:text-[#f87171]",
  "Open Library": "bg-[#553b08]/12 text-[#553b08] dark:bg-[#d4a853]/16 dark:text-[#d4a853]",
  "Google Books": "bg-[#1a3a5c]/12 text-[#1a3a5c] dark:bg-[#4285f4]/16 dark:text-[#93c5fd]",
  "Apple Podcasts": "bg-[#6b3fa0]/12 text-[#6b3fa0] dark:bg-[#bf5af2]/16 dark:text-[#d8b4fe]",
  "Apple Music": "bg-[#9e0038]/12 text-[#9e0038] dark:bg-[#fc3c44]/16 dark:text-[#fca5a5]",
  Apple: "bg-[#333]/12 text-[#333] dark:bg-[#a1a1aa]/16 dark:text-[#d4d4d8]",
  Wikipedia: "bg-[#2c4a6e]/12 text-[#2c4a6e] dark:bg-[#94a3b8]/16 dark:text-[#cbd5e1]",
  Letterboxd: "bg-[#2c5234]/12 text-[#2c5234] dark:bg-[#00e054]/16 dark:text-[#6ee7b7]",
  Metacritic: "bg-[#2c5234]/12 text-[#2c5234] dark:bg-[#66cc33]/16 dark:text-[#86efac]",
  Audible: "bg-[#f97316]/12 text-[#c2410c] dark:bg-[#fb923c]/16 dark:text-[#fdba74]",
  YouTube: "bg-[#7f1d1d]/12 text-[#7f1d1d] dark:bg-[#ef4444]/16 dark:text-[#fca5a5]",
  Netflix: "bg-[#7f1d1d]/12 text-[#7f1d1d] dark:bg-[#e50914]/16 dark:text-[#fca5a5]",
};

const DEFAULT_SOURCE_COLOR = "bg-muted/50 text-muted";

export function sourceFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [pattern, label] of HOST_SOURCES) {
      if (pattern.test(host)) return label;
    }
  } catch {
    // ignore invalid URLs
  }
  return undefined;
}

export function resolveItemSource(input: SourceInput): string | undefined {
  const trimmed = input.sourceName?.trim();
  if (trimmed) return trimmed;

  const fromUrl = sourceFromUrl(input.watchUrl);
  if (fromUrl) return fromUrl;

  const fromRating = input.rating?.source?.trim();
  if (fromRating) return fromRating;

  const fallback = input.fallbackSource?.trim();
  if (fallback) return fallback;

  return undefined;
}

export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? DEFAULT_SOURCE_COLOR;
}
