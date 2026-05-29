import { isNumericId, normalizeExploreId, parseItunesId, parseProviderId } from "./explore-id";
import type { ContentRating } from "./rating";
import { itunesRating, openLibraryRating, rawgRating, tmdbRating, tvmazeRating } from "./rating";
import { searchGamesWikipedia } from "./search-games";
import { searchMovies, searchSeries } from "./search-media";
import { resolveTmdbTitle } from "./titles";
import { hasTmdbKey, tmdbFetch, tmdbPosterUrl } from "./tmdb";
import type { LeisureType, SearchResult } from "./types";

export interface ExploreItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  watchUrl?: string;
  year?: number;
  rating?: ContentRating;
  originalTitle?: string;
}

export interface ExploreItemDetail extends ExploreItem {
  description?: string;
  sourceName?: string;
}

export interface ExplorePageResult {
  items: ExploreItem[];
  page: number;
  hasMore: boolean;
}

export interface ExploreSection {
  type: LeisureType;
  title: string;
  items: ExploreItem[];
}

const FETCH_INIT: RequestInit = { next: { revalidate: 3600 } };
const UA = { "User-Agent": "FunMun/1.0 (https://github.com/fun-mun)" };

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function toExploreItem(
  id: string,
  title: string,
  opts?: {
    subtitle?: string;
    imageUrl?: string;
    watchUrl?: string;
    year?: number;
    rating?: ContentRating;
    originalTitle?: string;
  },
): ExploreItem {
  return { id, title, ...opts };
}

type TmdbListItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

async function mapTmdbExploreItems(
  kind: "movie" | "tv",
  results: TmdbListItem[],
  limit?: number,
): Promise<ExploreItem[]> {
  const slice = results.slice(0, limit ?? results.length);
  const tmdbType = kind === "movie" ? "movie" : "tv";

  return Promise.all(
    slice.map(async (item) => {
      const localized = item.title ?? item.name ?? "Unknown";
      const original = item.original_title ?? item.original_name;
      const resolved = await resolveTmdbTitle(
        kind,
        String(item.id),
        localized,
        original,
        item.original_language,
      );
      const date = item.release_date ?? item.first_air_date;
      const year = date ? parseInt(date.slice(0, 4), 10) : undefined;

      return toExploreItem(String(item.id), resolved.title, {
        originalTitle: resolved.originalTitle,
        subtitle: item.overview?.slice(0, 100),
        imageUrl: tmdbPosterUrl(item.poster_path),
        watchUrl: `https://www.themoviedb.org/${tmdbType}/${item.id}`,
        year: Number.isNaN(year ?? NaN) ? undefined : year,
        rating: tmdbRating(item.vote_average),
      });
    }),
  );
}

async function fetchOpenLibraryTrending(limit = 10): Promise<ExploreItem[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=*&sort=rating desc&limit=${limit}&fields=title,author_name,cover_i,first_publish_year,key,ratings_average`,
    FETCH_INIT,
  );
  if (!res.ok) return fetchOpenLibraryTrendingDaily(limit);

  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      first_publish_year?: number;
      ratings_average?: number;
    }>;
  };

  return (data.docs ?? []).flatMap((doc) => {
    if (!doc.title) return [];
    return [
      toExploreItem(doc.key ?? doc.title, doc.title, {
        subtitle: doc.author_name?.join(", "),
        imageUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        watchUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        year: doc.first_publish_year,
        rating: openLibraryRating(doc.ratings_average),
      }),
    ];
  });
}

async function fetchOpenLibraryTrendingDaily(limit = 10): Promise<ExploreItem[]> {
  const res = await fetch(`https://openlibrary.org/trending/daily.json?limit=${limit}`, FETCH_INIT);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    works?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      authors?: Array<{ name?: string }>;
      cover_id?: number;
      first_publish_year?: number;
    }>;
  };

  return (data.works ?? []).flatMap((work) => {
    if (!work.title) return [];
    const authors =
      work.author_name?.join(", ") ??
      work.authors
        ?.map((a) => a.name)
        .filter(Boolean)
        .join(", ");
    return [
      toExploreItem(work.key ?? work.title, work.title, {
        subtitle: authors,
        imageUrl: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : undefined,
        watchUrl: work.key ? `https://openlibrary.org${work.key}` : undefined,
        year: work.first_publish_year,
      }),
    ];
  });
}

async function fetchOpenLibrarySubject(subject: string, limit = 10): Promise<ExploreItem[]> {
  const res = await fetch(
    `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&details=false`,
    FETCH_INIT,
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    works?: Array<{
      key?: string;
      title?: string;
      authors?: Array<{ name?: string }>;
      cover_id?: number;
      first_publish_year?: number;
    }>;
  };

  return (data.works ?? []).flatMap((work) => {
    if (!work.title) return [];
    return [
      toExploreItem(work.key ?? work.title, work.title, {
        subtitle: work.authors
          ?.map((a) => a.name)
          .filter(Boolean)
          .join(", "),
        imageUrl: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : undefined,
        watchUrl: work.key ? `https://openlibrary.org${work.key}` : undefined,
        year: work.first_publish_year,
      }),
    ];
  });
}

async function fetchTmdbPopular(kind: "movie" | "tv", limit = 10): Promise<ExploreItem[]> {
  const path = kind === "movie" ? "movie/popular" : "tv/popular";
  const res = await tmdbFetch(path, { page: "1" });
  if (!res?.ok) return [];

  const data = (await res.json()) as { results?: TmdbListItem[] };
  return mapTmdbExploreItems(kind, data.results ?? [], limit);
}

async function fetchItunesRss(
  feed: "topmovies" | "toptvseasons" | "toppodcasts",
  limit = 10,
): Promise<ExploreItem[]> {
  const res = await fetch(
    `https://itunes.apple.com/us/rss/${feed}/limit=${limit}/json`,
    FETCH_INIT,
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    feed?: {
      entry?: Array<{
        id?: { label?: string };
        "im:name"?: { label?: string };
        "im:artist"?: { label?: string };
        summary?: { label?: string };
        "im:image"?: Array<{ label?: string }>;
        link?: Array<{ attributes?: { href?: string } }>;
        "im:releaseDate"?: { label?: string };
      }>;
    };
  };

  const entries = data.feed?.entry;
  if (!entries) return [];
  const list = Array.isArray(entries) ? entries : [entries];

  return list.flatMap((entry) => {
    const title = entry["im:name"]?.label;
    if (!title) return [];
    const rawImages = entry["im:image"];
    const images = rawImages ? (Array.isArray(rawImages) ? rawImages : [rawImages]) : [];
    const imageUrl = images[images.length - 1]?.label;
    const releaseDate = entry["im:releaseDate"]?.label;
    const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : undefined;
    const rawLinks = entry.link;
    const links = rawLinks ? (Array.isArray(rawLinks) ? rawLinks : [rawLinks]) : [];
    const watchUrl = links.find((l) => l.attributes?.href)?.attributes?.href;
    const itunesId = parseItunesId(entry.id?.label ?? "") ?? parseItunesId(watchUrl ?? "") ?? null;
    if (!itunesId) return [];

    return [
      toExploreItem(itunesId, title, {
        subtitle: entry["im:artist"]?.label ?? entry.summary?.label?.slice(0, 80),
        imageUrl,
        watchUrl,
        year: Number.isNaN(year) ? undefined : year,
      }),
    ];
  });
}

const ITUNES_RSS_MAX = 100;

async function fetchItunesRssPage(
  feed: "topmovies" | "toptvseasons" | "toppodcasts",
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const end = page * limit;
  const fetchLimit = Math.min(end + 1, ITUNES_RSS_MAX);
  const all = await safe(() => fetchItunesRss(feed, fetchLimit), []);
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  const hasMore = all.length > end || (all.length === fetchLimit && fetchLimit < ITUNES_RSS_MAX);
  return { items, page, hasMore: items.length > 0 && hasMore };
}

async function fetchRawgPopular(limit = 10): Promise<ExploreItem[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return [];
  const gameKey = apiKey;

  async function load(ordering: string, extra?: Record<string, string>) {
    const params = new URLSearchParams({
      key: gameKey,
      ordering,
      page_size: String(limit),
      ...extra,
    });
    const res = await fetch(`https://api.rawg.io/api/games?${params}`, FETCH_INIT);
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
    return data.results ?? [];
  }

  let results = await load("-metacritic", { metacritic: "80,100" });
  if (results.length === 0) results = await load("-rating");

  return results.map((game) => {
    const year = game.released ? parseInt(game.released.slice(0, 4), 10) : undefined;
    return toExploreItem(String(game.id), game.name, {
      imageUrl: game.background_image,
      watchUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
      year: Number.isNaN(year) ? undefined : year,
      rating: rawgRating(game.rating, game.metacritic),
    });
  });
}

async function fetchWikipediaSearch(query: string, limit = 10): Promise<ExploreItem[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limit),
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "400",
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
        { pageid?: number; title?: string; description?: string; thumbnail?: { source?: string } }
      >;
    };
  };

  return Object.values(data.query?.pages ?? {}).flatMap((page) => {
    if (!page.title) return [];
    const slug = page.title.replace(/ /g, "_");
    return [
      toExploreItem(String(page.pageid ?? page.title), page.title, {
        subtitle: page.description?.slice(0, 100),
        imageUrl: page.thumbnail?.source,
        watchUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      }),
    ];
  });
}

async function fetchWikipediaPlaces(limit = 10): Promise<ExploreItem[]> {
  return fetchWikipediaSearch("famous tourist destination city", limit);
}

import {
  cleanGameTitle,
  GAME_WIKI_CATEGORIES,
  isWikiVideoGameArticle,
  yearFromGameDescription,
} from "./wiki-games";

type WikiGamePage = {
  pageid?: number;
  title?: string;
  description?: string;
  thumbnail?: { source?: string };
};

function wikiGamePageToItem(page: WikiGamePage): ExploreItem | null {
  if (!page.title || !isWikiVideoGameArticle(page.title, page.description)) return null;

  const slug = page.title.replace(/ /g, "_");
  return toExploreItem(String(page.pageid ?? page.title), cleanGameTitle(page.title), {
    subtitle: page.description?.slice(0, 100),
    imageUrl: page.thumbnail?.source,
    watchUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
    year: yearFromGameDescription(page.description),
  });
}

async function fetchWikipediaCategoryGames(
  category: string,
  limit: number,
  continueToken?: string,
): Promise<{ items: ExploreItem[]; continueToken?: string }> {
  const params = new URLSearchParams({
    action: "query",
    generator: "categorymembers",
    gcmtitle: category,
    gcmlimit: String(limit + 8),
    gcmtype: "page",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "400",
    format: "json",
    origin: "*",
  });
  if (continueToken) params.set("gcmcontinue", continueToken);

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    ...FETCH_INIT,
    headers: UA,
  });
  if (!res.ok) return { items: [] };

  const data = (await res.json()) as {
    continue?: { gcmcontinue?: string };
    query?: { pages?: Record<string, WikiGamePage> };
  };

  const items = Object.values(data.query?.pages ?? {})
    .flatMap((page) => {
      const item = wikiGamePageToItem(page);
      return item ? [item] : [];
    })
    .slice(0, limit);

  return { items, continueToken: data.continue?.gcmcontinue };
}

async function fetchWikipediaGames(limit = 10): Promise<ExploreItem[]> {
  for (const category of GAME_WIKI_CATEGORIES) {
    const { items } = await fetchWikipediaCategoryGames(category, limit);
    if (items.length > 0) return items;
  }
  return [];
}

async function fetchWikipediaGamesPage(
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const category = GAME_WIKI_CATEGORIES[(page - 1) % GAME_WIKI_CATEGORIES.length];
  const subPage = Math.floor((page - 1) / GAME_WIKI_CATEGORIES.length) + 1;

  let continueToken: string | undefined;
  let batch: { items: ExploreItem[]; continueToken?: string } = { items: [] };

  for (let i = 0; i < subPage; i++) {
    batch = await fetchWikipediaCategoryGames(category, limit, continueToken);
    continueToken = batch.continueToken;
    if (!continueToken) break;
  }

  const categoryIndex = (page - 1) % GAME_WIKI_CATEGORIES.length;
  const hasMore = Boolean(batch.continueToken) || categoryIndex < GAME_WIKI_CATEGORIES.length - 1;

  return {
    items: batch.items,
    page,
    hasMore: batch.items.length > 0 && hasMore,
  };
}

async function fetchTvmazePopular(limit = 10): Promise<ExploreItem[]> {
  const res = await fetch("https://api.tvmaze.com/shows?page=0", FETCH_INIT);
  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    id: number;
    name: string;
    summary?: string | null;
    image?: { medium?: string } | null;
    premiered?: string | null;
    url?: string;
    weight?: number;
    rating?: { average?: number | null };
  }>;

  return [...data]
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, limit)
    .map((show) => {
      const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : undefined;
      const summary = show.summary?.replace(/<[^>]+>/g, "").trim();
      return toExploreItem(`tvmaze-${show.id}`, show.name, {
        subtitle: summary?.slice(0, 100),
        imageUrl: show.image?.medium,
        watchUrl: show.url,
        year: Number.isNaN(year) ? undefined : year,
        rating: tvmazeRating(show.rating?.average),
      });
    });
}

export async function fetchExploreSections(): Promise<ExploreSection[]> {
  const [
    books,
    audiobooksSubject,
    moviesTmdb,
    moviesItunes,
    seriesTmdb,
    seriesTvmaze,
    seriesItunes,
    gamesRawg,
    gamesWiki,
    podcasts,
    places,
  ] = await Promise.all([
    safe(() => fetchOpenLibraryTrending(10), []),
    safe(() => fetchOpenLibrarySubject("audiobooks", 10), []),
    safe(() => fetchTmdbPopular("movie", 10), []),
    safe(() => fetchItunesRss("topmovies", 10), []),
    safe(() => fetchTmdbPopular("tv", 10), []),
    safe(() => fetchTvmazePopular(10), []),
    safe(() => fetchItunesRss("toptvseasons", 10), []),
    safe(() => fetchRawgPopular(10), []),
    safe(() => fetchWikipediaGames(10), []),
    safe(() => fetchItunesRss("toppodcasts", 10), []),
    safe(() => fetchWikipediaPlaces(10), []),
  ]);

  const movies = moviesTmdb.length > 0 ? moviesTmdb : moviesItunes;
  const series =
    seriesTmdb.length > 0 ? seriesTmdb : seriesTvmaze.length > 0 ? seriesTvmaze : seriesItunes;
  const games = gamesRawg.length > 0 ? gamesRawg : gamesWiki;
  const audiobooks =
    audiobooksSubject.length > 0
      ? audiobooksSubject
      : await safe(() => fetchOpenLibrarySubject("science_fiction", 8), []);

  const sections: ExploreSection[] = [
    { type: "book", title: "Trending books", items: books },
    { type: "game", title: "Top-rated games", items: games },
    { type: "movie", title: "Popular movies", items: movies },
    { type: "series", title: "Popular series", items: series },
    { type: "podcast", title: "Top podcasts", items: podcasts },
    { type: "audiobook", title: "Popular audiobooks", items: audiobooks },
    { type: "place", title: "Places to visit", items: places },
  ];

  return sections.filter((s) => s.items.length > 0);
}

const PAGE_SIZE = 20;

const BOOK_SUBJECTS = ["fiction", "science_fiction", "fantasy", "mystery", "romance", "history"];
const PLACE_QUERIES = [
  "famous tourist destination city",
  "world heritage site",
  "national park landmark",
  "historic city travel",
];

async function fetchOpenLibrarySubjectPage(
  subject: string,
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const offset = (page - 1) * limit;
  const res = await fetch(
    `https://openlibrary.org/search.json?q=subject:${encodeURIComponent(subject)}&sort=rating desc&limit=${limit}&offset=${offset}&fields=title,author_name,cover_i,first_publish_year,key,ratings_average`,
    FETCH_INIT,
  );
  if (!res.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      first_publish_year?: number;
      ratings_average?: number;
    }>;
    numFound?: number;
  };

  const items = (data.docs ?? []).flatMap((doc) => {
    if (!doc.title) return [];
    return [
      toExploreItem(doc.key ?? doc.title, doc.title, {
        subtitle: doc.author_name?.join(", "),
        imageUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        watchUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        year: doc.first_publish_year,
        rating: openLibraryRating(doc.ratings_average),
      }),
    ];
  });

  const total = data.numFound ?? 0;
  return { items, page, hasMore: offset + items.length < total };
}

async function fetchTmdbPopularPage(
  kind: "movie" | "tv",
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const path = kind === "movie" ? "movie/popular" : "tv/popular";
  const res = await tmdbFetch(path, { page: String(page) });
  if (!res?.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    results?: TmdbListItem[];
    total_pages?: number;
  };

  const items = await mapTmdbExploreItems(kind, data.results ?? [], limit);

  const totalPages = data.total_pages ?? page;
  return { items, page, hasMore: page < totalPages };
}

async function fetchTvmazePage(page: number, limit = PAGE_SIZE): Promise<ExplorePageResult> {
  const res = await fetch(`https://api.tvmaze.com/shows?page=${page - 1}`, FETCH_INIT);
  if (!res.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as Array<{
    id: number;
    name: string;
    summary?: string | null;
    image?: { medium?: string } | null;
    premiered?: string | null;
    url?: string;
    rating?: { average?: number | null };
  }>;

  const items = data.slice(0, limit).map((show) => {
    const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : undefined;
    const summary = show.summary?.replace(/<[^>]+>/g, "").trim();
    return toExploreItem(`tvmaze-${show.id}`, show.name, {
      subtitle: summary?.slice(0, 100),
      imageUrl: show.image?.medium,
      watchUrl: show.url,
      year: Number.isNaN(year) ? undefined : year,
      rating: tvmazeRating(show.rating?.average),
    });
  });

  return { items, page, hasMore: items.length >= limit };
}

async function fetchRawgPage(page: number, limit = PAGE_SIZE): Promise<ExplorePageResult> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return { items: [], page, hasMore: false };

  const params = new URLSearchParams({
    key: apiKey,
    ordering: "-rating",
    page: String(page),
    page_size: String(limit),
  });
  const res = await fetch(`https://api.rawg.io/api/games?${params}`, FETCH_INIT);
  if (!res.ok) return { items: [], page, hasMore: false };

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
    next?: string | null;
  };

  const items = (data.results ?? []).map((game) => {
    const year = game.released ? parseInt(game.released.slice(0, 4), 10) : undefined;
    return toExploreItem(String(game.id), game.name, {
      imageUrl: game.background_image,
      watchUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
      year: Number.isNaN(year) ? undefined : year,
      rating: rawgRating(game.rating, game.metacritic),
    });
  });

  return { items, page, hasMore: Boolean(data.next) };
}

async function fetchItunesSearchPage(
  term: string,
  entity: string,
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({
    term,
    entity,
    limit: String(limit),
    offset: String(offset),
    country: "US",
  });
  const res = await fetch(`https://itunes.apple.com/search?${params}`, {
    ...FETCH_INIT,
    headers: UA,
  });
  if (!res.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    results?: Array<{
      trackId?: number;
      collectionId?: number;
      trackName?: string;
      collectionName?: string;
      artistName?: string;
      artworkUrl100?: string;
      releaseDate?: string;
      trackViewUrl?: string;
      collectionViewUrl?: string;
      description?: string;
      averageUserRating?: number;
    }>;
    resultCount?: number;
  };

  const items = (data.results ?? []).flatMap((item) => {
    const title = item.trackName ?? item.collectionName;
    if (!title) return [];
    const id = String(item.trackId ?? item.collectionId ?? title);
    const releaseDate = item.releaseDate;
    const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : undefined;
    return [
      toExploreItem(id, title, {
        subtitle: item.artistName ?? item.description?.slice(0, 80),
        imageUrl: item.artworkUrl100?.replace("100x100", "300x300"),
        watchUrl: item.trackViewUrl ?? item.collectionViewUrl,
        year: Number.isNaN(year) ? undefined : year,
        rating: itunesRating(item.averageUserRating),
      }),
    ];
  });

  const total = data.resultCount ?? 0;
  return { items, page, hasMore: offset + items.length < total && items.length > 0 };
}

async function fetchWikipediaPage(
  query: string,
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limit),
    gsroffset: String(offset),
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "400",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    ...FETCH_INIT,
    headers: UA,
  });
  if (!res.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    continue?: { gsroffset?: number };
    query?: {
      pages?: Record<
        string,
        { pageid?: number; title?: string; description?: string; thumbnail?: { source?: string } }
      >;
    };
  };

  const items = Object.values(data.query?.pages ?? {}).flatMap((p) => {
    if (!p.title) return [];
    const slug = p.title.replace(/ /g, "_");
    return [
      toExploreItem(String(p.pageid ?? p.title), p.title, {
        subtitle: p.description?.slice(0, 100),
        imageUrl: p.thumbnail?.source,
        watchUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      }),
    ];
  });

  return { items, page, hasMore: Boolean(data.continue?.gsroffset) };
}

export async function fetchExplorePage(type: LeisureType, page = 1): Promise<ExplorePageResult> {
  const safePage = Math.max(1, page);

  switch (type) {
    case "book": {
      if (safePage === 1) {
        const trending = await safe(() => fetchOpenLibraryTrending(PAGE_SIZE), []);
        if (trending.length > 0) {
          return { items: trending, page: safePage, hasMore: true };
        }
      }
      const subject = BOOK_SUBJECTS[(safePage - 1) % BOOK_SUBJECTS.length];
      const subjectPage = Math.floor((safePage - 1) / BOOK_SUBJECTS.length) + 1;
      return fetchOpenLibrarySubjectPage(subject, subjectPage);
    }
    case "audiobook": {
      const result = await fetchOpenLibrarySubjectPage("audiobooks", safePage);
      if (result.items.length > 0) return result;
      return fetchOpenLibrarySubjectPage("science_fiction", safePage);
    }
    case "movie": {
      const tmdb = await safe(() => fetchTmdbPopularPage("movie", safePage), {
        items: [],
        page: safePage,
        hasMore: false,
      });
      if (tmdb.items.length > 0) return tmdb;
      return fetchItunesRssPage("topmovies", safePage);
    }
    case "series": {
      const tmdb = await safe(() => fetchTmdbPopularPage("tv", safePage), {
        items: [],
        page: safePage,
        hasMore: false,
      });
      if (tmdb.items.length > 0) return tmdb;
      const tvmaze = await safe(() => fetchTvmazePage(safePage), {
        items: [],
        page: safePage,
        hasMore: false,
      });
      if (tvmaze.items.length > 0) return tvmaze;
      return fetchItunesRssPage("toptvseasons", safePage);
    }
    case "game": {
      const rawg = await fetchRawgPage(safePage);
      if (rawg.items.length > 0) return rawg;
      return fetchWikipediaGamesPage(safePage);
    }
    case "podcast":
      return fetchItunesSearchPage("podcast", "podcast", safePage);
    case "place": {
      const query = PLACE_QUERIES[(safePage - 1) % PLACE_QUERIES.length];
      const queryPage = Math.floor((safePage - 1) / PLACE_QUERIES.length) + 1;
      return fetchWikipediaPage(query, queryPage);
    }
    default:
      return { items: [], page: safePage, hasMore: false };
  }
}

function searchResultToExploreItem(result: SearchResult): ExploreItem {
  return toExploreItem(result.id, result.title, {
    subtitle: result.subtitle,
    originalTitle: result.originalTitle,
    imageUrl: result.imageUrl,
    watchUrl: result.sourceUrl,
    year: result.year,
    rating: result.rating,
  });
}

async function fetchOpenLibrarySearchPage(
  q: string,
  page: number,
  limit = PAGE_SIZE,
  subject?: string,
): Promise<ExplorePageResult> {
  const offset = (page - 1) * limit;
  const searchQ = subject ? `${q} subject:${subject}` : q;
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&limit=${limit}&offset=${offset}&fields=title,author_name,cover_i,first_publish_year,key,ratings_average`,
    FETCH_INIT,
  );
  if (!res.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      first_publish_year?: number;
      ratings_average?: number;
    }>;
    numFound?: number;
  };

  const items = (data.docs ?? []).flatMap((doc) => {
    if (!doc.title) return [];
    return [
      toExploreItem(doc.key ?? doc.title, doc.title, {
        subtitle: doc.author_name?.join(", "),
        imageUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        watchUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        year: doc.first_publish_year,
        rating: openLibraryRating(doc.ratings_average),
      }),
    ];
  });

  const total = data.numFound ?? 0;
  return { items, page, hasMore: offset + items.length < total };
}

async function fetchTmdbSearchPage(
  kind: "movie" | "tv",
  q: string,
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const path = kind === "movie" ? "search/movie" : "search/tv";
  const res = await tmdbFetch(path, { query: q, page: String(page) });
  if (!res?.ok) return { items: [], page, hasMore: false };

  const data = (await res.json()) as {
    results?: TmdbListItem[];
    total_pages?: number;
  };

  const items = await mapTmdbExploreItems(kind, data.results ?? [], limit);
  const totalPages = data.total_pages ?? page;
  return { items, page, hasMore: page < totalPages };
}

async function fetchRawgSearchPage(
  q: string,
  page: number,
  limit = PAGE_SIZE,
): Promise<ExplorePageResult> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    if (page > 1) return { items: [], page, hasMore: false };
    const fallback = await searchGamesWikipedia(q);
    const items = fallback.map(searchResultToExploreItem);
    return { items, page, hasMore: false };
  }

  const params = new URLSearchParams({
    key: apiKey,
    search: q,
    page: String(page),
    page_size: String(limit),
  });
  const res = await fetch(`https://api.rawg.io/api/games?${params}`, FETCH_INIT);
  if (!res.ok) return { items: [], page, hasMore: false };

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
    next?: string | null;
  };

  const items = (data.results ?? []).map((game) => {
    const year = game.released ? parseInt(game.released.slice(0, 4), 10) : undefined;
    return toExploreItem(String(game.id), game.name, {
      imageUrl: game.background_image,
      watchUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
      year: Number.isNaN(year) ? undefined : year,
      rating: rawgRating(game.rating, game.metacritic),
    });
  });

  return { items, page, hasMore: Boolean(data.next) };
}

async function fetchMediaSearchFallback(
  kind: "movie" | "series",
  q: string,
  page: number,
): Promise<ExplorePageResult> {
  if (page > 1) return { items: [], page, hasMore: false };
  const results =
    kind === "movie" ? await searchMovies(q, PAGE_SIZE) : await searchSeries(q, PAGE_SIZE);
  const items = results.map(searchResultToExploreItem);
  return { items, page, hasMore: false };
}

async function fetchMediaSearchPage(
  kind: "movie" | "series",
  q: string,
  page: number,
): Promise<ExplorePageResult> {
  if (page === 1) {
    return fetchMediaSearchFallback(kind, q, page);
  }

  if (!hasTmdbKey()) {
    return { items: [], page, hasMore: false };
  }

  const tmdbKind = kind === "movie" ? "movie" : "tv";
  return safe(() => fetchTmdbSearchPage(tmdbKind, q, page), { items: [], page, hasMore: false });
}

export async function searchExploreCategory(
  type: LeisureType,
  query: string,
  page = 1,
): Promise<ExplorePageResult> {
  const q = query.trim();
  const safePage = Math.max(1, page);
  if (!q || q.length < 2) return { items: [], page: safePage, hasMore: false };

  switch (type) {
    case "book":
      return fetchOpenLibrarySearchPage(q, safePage);
    case "audiobook":
      return fetchOpenLibrarySearchPage(q, safePage, PAGE_SIZE, "audiobooks");
    case "movie":
      return fetchMediaSearchPage("movie", q, safePage);
    case "series":
      return fetchMediaSearchPage("series", q, safePage);
    case "game":
      return fetchRawgSearchPage(q, safePage);
    case "podcast":
      return fetchItunesSearchPage(q, "podcast", safePage);
    case "place":
      return fetchWikipediaPage(q, safePage);
    default:
      return { items: [], page: safePage, hasMore: false };
  }
}

async function fetchOpenLibraryWork(id: string): Promise<ExploreItemDetail | null> {
  const key = id.startsWith("/works/") ? id : id.startsWith("OL") ? `/works/${id}` : id;
  const [workRes, ratingsRes] = await Promise.all([
    fetch(`https://openlibrary.org${key}.json`, FETCH_INIT),
    fetch(`https://openlibrary.org${key}/ratings.json`, FETCH_INIT),
  ]);
  if (!workRes.ok) return null;

  const data = (await workRes.json()) as {
    title?: string;
    description?: string | { value?: string };
    covers?: number[];
    first_publish_date?: string;
    subjects?: string[];
  };

  let rating: ContentRating | undefined;
  if (ratingsRes.ok) {
    const ratings = (await ratingsRes.json()) as { summary?: { average?: number } };
    rating = openLibraryRating(ratings.summary?.average);
  }

  const description =
    typeof data.description === "string" ? data.description : data.description?.value;
  const year = data.first_publish_date
    ? parseInt(data.first_publish_date.slice(0, 4), 10)
    : undefined;

  return {
    id: key,
    title: data.title ?? "Unknown",
    subtitle: data.subjects?.slice(0, 3).join(", "),
    description: description?.slice(0, 800),
    imageUrl: data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
      : undefined,
    watchUrl: `https://openlibrary.org${key}`,
    year: Number.isNaN(year ?? NaN) ? undefined : year,
    sourceName: "Open Library",
    rating,
  };
}

async function fetchTmdbDetail(
  kind: "movie" | "tv",
  id: string,
): Promise<ExploreItemDetail | null> {
  const path = kind === "movie" ? `movie/${id}` : `tv/${id}`;
  const res = await tmdbFetch(path);
  if (!res?.ok) return null;

  const data = (await res.json()) as {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    original_language?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    homepage?: string;
    vote_average?: number;
  };

  const localized = data.title ?? data.name ?? "Unknown";
  const resolved = await resolveTmdbTitle(
    kind,
    id,
    localized,
    data.original_title ?? data.original_name,
    data.original_language,
  );
  const date = data.release_date ?? data.first_air_date;
  const year = date ? parseInt(date.slice(0, 4), 10) : undefined;
  const tmdbType = kind === "movie" ? "movie" : "tv";

  return {
    id: String(data.id),
    title: resolved.title,
    originalTitle: resolved.originalTitle,
    description: data.overview,
    imageUrl: tmdbPosterUrl(data.poster_path, "w780"),
    watchUrl: data.homepage ?? `https://www.themoviedb.org/${tmdbType}/${data.id}`,
    year: Number.isNaN(year ?? NaN) ? undefined : year,
    sourceName: "TMDB",
    rating: tmdbRating(data.vote_average),
  };
}

async function fetchTvmazeDetail(id: string): Promise<ExploreItemDetail | null> {
  const res = await fetch(`https://api.tvmaze.com/shows/${id}`, FETCH_INIT);
  if (!res.ok) return null;

  const show = (await res.json()) as {
    id: number;
    name: string;
    summary?: string | null;
    image?: { original?: string; medium?: string } | null;
    premiered?: string | null;
    url?: string;
    genres?: string[];
    rating?: { average?: number | null };
  };

  const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : undefined;
  const summary = show.summary?.replace(/<[^>]+>/g, "").trim();

  return {
    id: `tvmaze-${show.id}`,
    title: show.name,
    subtitle: show.genres?.join(", "),
    description: summary,
    imageUrl: show.image?.original ?? show.image?.medium,
    watchUrl: show.url,
    year: Number.isNaN(year ?? NaN) ? undefined : year,
    sourceName: "TVMaze",
    rating: tvmazeRating(show.rating?.average),
  };
}

async function fetchRawgDetailById(id: string, apiKey: string): Promise<ExploreItemDetail | null> {
  const res = await fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`, FETCH_INIT);
  if (!res.ok) return null;

  const game = (await res.json()) as {
    id: number;
    name: string;
    description_raw?: string;
    background_image?: string;
    released?: string;
    slug?: string;
    genres?: Array<{ name: string }>;
    rating?: number;
    metacritic?: number | null;
  };

  const year = game.released ? parseInt(game.released.slice(0, 4), 10) : undefined;

  return {
    id: String(game.id),
    title: game.name,
    subtitle: game.genres?.map((g) => g.name).join(", "),
    description: game.description_raw?.replace(/<[^>]+>/g, "").slice(0, 800),
    imageUrl: game.background_image,
    watchUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
    year: Number.isNaN(year ?? NaN) ? undefined : year,
    sourceName: "RAWG",
    rating: rawgRating(game.rating, game.metacritic),
  };
}

async function fetchRawgDetail(id: string): Promise<ExploreItemDetail | null> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  const decodedId = normalizeExploreId(id);
  if (isNumericId(decodedId)) {
    return fetchRawgDetailById(decodedId, apiKey);
  }

  const params = new URLSearchParams({
    key: apiKey,
    search: decodedId,
    page_size: "1",
  });
  const searchRes = await fetch(`https://api.rawg.io/api/games?${params}`, FETCH_INIT);
  if (!searchRes.ok) return null;

  const searchData = (await searchRes.json()) as { results?: Array<{ id: number }> };
  const match = searchData.results?.[0];
  if (!match) return null;

  return fetchRawgDetailById(String(match.id), apiKey);
}

const ITUNES_SOURCE_BY_KIND: Record<string, string> = {
  "feature-movie": "Apple TV",
  movie: "Apple TV",
  "tv-season": "Apple TV",
  "tv-episode": "Apple TV",
  podcast: "Apple Podcasts",
  "podcast-episode": "Apple Podcasts",
  audiobook: "Apple Books",
  "audiobook-episode": "Apple Books",
};

const ITUNES_SOURCE_BY_TYPE: Partial<Record<LeisureType, string>> = {
  movie: "Apple TV",
  series: "Apple TV",
  podcast: "Apple Podcasts",
  audiobook: "Apple Books",
};

function itunesSourceLabel(kind?: string, category?: LeisureType): string {
  if (kind) {
    const label = ITUNES_SOURCE_BY_KIND[kind.toLowerCase()];
    if (label) return label;
  }
  if (category) {
    const label = ITUNES_SOURCE_BY_TYPE[category];
    if (label) return label;
  }
  return "Apple iTunes";
}

async function fetchItunesLookup(
  id: string,
  category?: LeisureType,
): Promise<ExploreItemDetail | null> {
  const lookupId = parseItunesId(id);
  if (!lookupId) return null;

  const res = await fetch(`https://itunes.apple.com/lookup?id=${lookupId}`, {
    ...FETCH_INIT,
    headers: UA,
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{
      trackId?: number;
      collectionId?: number;
      trackName?: string;
      collectionName?: string;
      artistName?: string;
      artworkUrl100?: string;
      releaseDate?: string;
      trackViewUrl?: string;
      collectionViewUrl?: string;
      description?: string;
      longDescription?: string;
      averageUserRating?: number;
      kind?: string;
    }>;
  };

  const item = data.results?.[0];
  if (!item) return null;

  const title = item.trackName ?? item.collectionName ?? "Unknown";
  const itemId = String(item.trackId ?? item.collectionId ?? id);
  const year = item.releaseDate ? parseInt(item.releaseDate.slice(0, 4), 10) : undefined;

  return {
    id: itemId,
    title,
    subtitle: item.artistName,
    description: item.longDescription ?? item.description,
    imageUrl: item.artworkUrl100?.replace("100x100", "600x600"),
    watchUrl: item.trackViewUrl ?? item.collectionViewUrl,
    year: Number.isNaN(year ?? NaN) ? undefined : year,
    sourceName: itunesSourceLabel(item.kind, category),
    rating: itunesRating(item.averageUserRating),
  };
}

async function fetchWikipediaDetail(id: string): Promise<ExploreItemDetail | null> {
  const decodedId = normalizeExploreId(id);

  type WikiPage = {
    pageid?: number;
    title?: string;
    description?: string;
    extract?: string;
    original?: { source?: string };
    missing?: boolean;
  };

  async function pageToDetail(page: WikiPage): Promise<ExploreItemDetail | null> {
    if (!page.title || page.missing) return null;

    const slug = page.title.replace(/ /g, "_");
    return {
      id: String(page.pageid ?? decodedId),
      title: page.title,
      subtitle: page.description,
      description: page.extract?.slice(0, 800),
      imageUrl: page.original?.source,
      watchUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      sourceName: "Wikipedia",
    };
  }

  async function fetchWikiQuery(query: Record<string, string>): Promise<ExploreItemDetail | null> {
    const params = new URLSearchParams({
      action: "query",
      prop: "pageimages|description|extracts",
      piprop: "original",
      exintro: "1",
      explaintext: "1",
      format: "json",
      origin: "*",
      ...query,
    });

    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      ...FETCH_INIT,
      headers: UA,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: { pages?: Record<string, WikiPage> };
    };

    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page) return null;
    return pageToDetail(page);
  }

  if (isNumericId(decodedId)) {
    return fetchWikiQuery({ pageids: decodedId });
  }

  const titleCandidates = [
    decodedId,
    decodedId.replace(/_/g, " "),
    `${decodedId} (video game)`,
    `${decodedId.replace(/_/g, " ")} (video game)`,
  ];

  for (const title of [...new Set(titleCandidates)]) {
    const item = await fetchWikiQuery({ titles: title });
    if (item) return item;
  }

  return null;
}

export async function fetchExploreItem(
  type: LeisureType,
  id: string,
): Promise<ExploreItemDetail | null> {
  const decodedId = normalizeExploreId(id);

  switch (type) {
    case "book":
    case "audiobook":
      return safe(() => fetchOpenLibraryWork(decodedId), null);
    case "movie":
      if (isNumericId(decodedId)) {
        const tmdb = await safe(() => fetchTmdbDetail("movie", decodedId), null);
        if (tmdb) return tmdb;
      }
      return safe(() => fetchItunesLookup(decodedId, "movie"), null);
    case "series": {
      const { provider, value } = parseProviderId(decodedId);
      if (provider === "tvmaze") {
        return safe(() => fetchTvmazeDetail(value), null);
      }
      if (provider === "tmdb") {
        return safe(() => fetchTmdbDetail("tv", value), null);
      }
      if (isNumericId(value)) {
        const tvmaze = await safe(() => fetchTvmazeDetail(value), null);
        if (tvmaze) return tvmaze;
        return safe(() => fetchTmdbDetail("tv", value), null);
      }
      return safe(() => fetchItunesLookup(decodedId, "series"), null);
    }
    case "game":
      return (
        (await safe(() => fetchRawgDetail(decodedId), null)) ??
        (await safe(() => fetchWikipediaDetail(decodedId), null))
      );
    case "podcast":
      return safe(() => fetchItunesLookup(decodedId, "podcast"), null);
    case "place":
      return safe(() => fetchWikipediaDetail(decodedId), null);
    default:
      return null;
  }
}
