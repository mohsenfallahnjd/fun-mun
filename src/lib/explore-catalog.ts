import { normalizeExploreId } from "./explore-id";
import type { LeisureType } from "./types";

export type ExploreLeisureType = Exclude<LeisureType, "article">;

export const EXPLORE_CATEGORY_META: Record<
  ExploreLeisureType,
  { title: string; description: string; source: string }
> = {
  book: {
    title: "Books",
    description: "Trending and popular reads from Open Library.",
    source: "Open Library",
  },
  audiobook: {
    title: "Audiobooks",
    description: "Popular audiobooks and spoken-word picks.",
    source: "Open Library",
  },
  podcast: {
    title: "Podcasts",
    description: "Top podcasts from Apple Podcasts.",
    source: "Apple Podcasts",
  },
  movie: {
    title: "Movies",
    description: "Popular and top-rated films.",
    source: "TMDB",
  },
  series: {
    title: "Series",
    description: "TV shows and series worth watching.",
    source: "TMDB",
  },
  game: {
    title: "Games",
    description: "Top-rated video games.",
    source: "RAWG",
  },
  place: {
    title: "Places",
    description: "Destinations and landmarks to explore.",
    source: "Wikipedia",
  },
};

export function parseExploreType(value: string): ExploreLeisureType | null {
  return value in EXPLORE_CATEGORY_META ? (value as ExploreLeisureType) : null;
}

export function exploreItemPath(type: ExploreLeisureType, id: string): string {
  return `/explore/${type}/${encodeURIComponent(normalizeExploreId(id))}`;
}

export function exploreCategoryPath(type: ExploreLeisureType): string {
  return `/explore/${type}`;
}
