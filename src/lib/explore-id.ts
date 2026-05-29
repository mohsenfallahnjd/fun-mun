/** Fully decode an explore item id (handles accidental double-encoding). */
export function normalizeExploreId(id: string): string {
  let value = id.trim();
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(value);
      if (next === value) break;
      value = next;
    } catch {
      break;
    }
  }
  return value;
}

/** Extract a numeric iTunes id from a raw id or apple.com URL. */
export function parseItunesId(idOrUrl: string): string | null {
  const value = normalizeExploreId(idOrUrl);
  if (/^\d+$/.test(value)) return value;

  const match = value.match(/(?:^|[/?&])id(\d+)\b/i);
  return match?.[1] ?? null;
}

export function isNumericId(id: string): boolean {
  return /^\d+$/.test(normalizeExploreId(id));
}

export type MediaProvider = "tvmaze" | "tmdb";

/** Parse prefixed media ids from search (e.g. tvmaze-216, tmdb-60625). */
export function parseProviderId(id: string): { provider: MediaProvider | null; value: string } {
  const value = normalizeExploreId(id);
  const tvmazeMatch = value.match(/^tvmaze-(\d+)$/i);
  if (tvmazeMatch) return { provider: "tvmaze", value: tvmazeMatch[1] };

  const tmdbMatch = value.match(/^tmdb-(\d+)$/i);
  if (tmdbMatch) return { provider: "tmdb", value: tmdbMatch[1] };

  return { provider: null, value };
}

export function exploreItemApiPath(type: string, id: string): string {
  return `/api/explore/${type}/${encodeURIComponent(normalizeExploreId(id))}`;
}
