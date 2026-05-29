const TMDB_BASE = "https://api.themoviedb.org/3";

const FETCH_INIT: RequestInit = {
  next: { revalidate: 3600 },
  headers: { Accept: "application/json" },
};

function getTmdbToken(): string | undefined {
  const token = process.env.TMDB_API_KEY?.trim();
  return token || undefined;
}

/** TMDB accepts either a v3 API key (query param) or a v4 read token (Bearer JWT). */
export async function tmdbFetch(
  path: string,
  params: Record<string, string> = {},
): Promise<Response | null> {
  const token = getTmdbToken();
  if (!token) return null;

  const search = new URLSearchParams({ language: "en-US", ...params });
  const isBearer = token.startsWith("eyJ");

  if (isBearer) {
    return fetch(`${TMDB_BASE}/${path}?${search}`, {
      ...FETCH_INIT,
      headers: {
        ...FETCH_INIT.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  search.set("api_key", token);
  return fetch(`${TMDB_BASE}/${path}?${search}`, FETCH_INIT);
}

export function hasTmdbKey(): boolean {
  return Boolean(getTmdbToken());
}

export function tmdbPosterUrl(path: string | null | undefined, size = "w342"): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}
