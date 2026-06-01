export interface ContentRating {
  value: number;
  max: number;
  source: string;
}

export function tmdbRating(voteAverage?: number | null): ContentRating | undefined {
  if (voteAverage == null || voteAverage <= 0) return undefined;
  return { value: voteAverage, max: 10, source: "TMDB" };
}

export function tvmazeRating(average?: number | null): ContentRating | undefined {
  if (average == null || average <= 0) return undefined;
  return { value: average, max: 10, source: "TVMaze" };
}

export function rawgRating(
  rating?: number | null,
  metacritic?: number | null,
): ContentRating | undefined {
  if (metacritic != null && metacritic > 0) {
    return { value: metacritic, max: 100, source: "Metacritic" };
  }
  if (rating != null && rating > 0) {
    return { value: rating, max: 5, source: "RAWG" };
  }
  return undefined;
}

export function openLibraryRating(average?: number | null): ContentRating | undefined {
  if (average == null || average <= 0) return undefined;
  return { value: average, max: 5, source: "Open Library" };
}

export function googleBooksRating(average?: number | null): ContentRating | undefined {
  if (average == null || average <= 0) return undefined;
  return { value: average, max: 5, source: "Google Books" };
}

export function itunesRating(average?: number | null): ContentRating | undefined {
  if (average == null || average <= 0) return undefined;
  return { value: average, max: 5, source: "Apple" };
}

/** Short score for cards, e.g. "8.4", "92", "4.5" */
export function formatRatingScore(rating: ContentRating): string {
  if (rating.max === 100) return String(Math.round(rating.value));
  return rating.value.toFixed(1);
}

/** Full label for detail views, e.g. "8.4 / 10 · TMDB" */
export function formatRatingLabel(rating: ContentRating): string {
  if (rating.max === 100) {
    return `${Math.round(rating.value)} · ${rating.source}`;
  }
  return `${rating.value.toFixed(1)} / ${rating.max} · ${rating.source}`;
}
