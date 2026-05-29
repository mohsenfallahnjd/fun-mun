export type LeisureType = "book" | "audiobook" | "podcast" | "movie" | "series" | "place" | "game";

export type LeisureStatus = "queue" | "active" | "done";

import type { ContentRating } from "./rating";

export interface LeisureProgress {
  page?: number;
  totalPages?: number;
  watchedMinutes?: number;
  totalMinutes?: number;
  season?: number;
  episode?: number;
  hoursPlayed?: number;
}

export interface LeisureItem {
  id: string;
  type: LeisureType;
  title: string;
  subtitle?: string;
  originalTitle?: string;
  imageUrl?: string;
  watchUrl?: string;
  notes?: string;
  status: LeisureStatus;
  year?: number;
  rating?: ContentRating;
  progress?: LeisureProgress;
  order?: number;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  originalTitle?: string;
  imageUrl?: string;
  year?: number;
  sourceUrl?: string;
  rating?: ContentRating;
}

export interface TypedSearchResult extends SearchResult {
  type: LeisureType;
}

export interface SearchResponse {
  results: SearchResult[];
  hint?: "missing_tmdb_key" | "missing_rawg_key" | "no_results";
}

export const STATUS_OPTIONS: {
  value: LeisureStatus;
  label: string;
  shortLabel: string;
}[] = [
  { value: "queue", label: "Queue", shortLabel: "Queue" },
  { value: "active", label: "In progress", shortLabel: "Active" },
  { value: "done", label: "Done", shortLabel: "Done" },
];

export const STATUS_CARD_CLASS: Record<LeisureStatus, string> = {
  queue: "border-border bg-surface",
  active: "border-accent/45 bg-accent/10 ring-1 ring-accent/20 shadow-sm shadow-accent/5",
  done: "border-[var(--success)]/35 bg-[var(--success)]/8 opacity-90",
};

export const STATUS_PICKER_ACTIVE: Record<LeisureStatus, string> = {
  queue: "bg-surface text-foreground shadow-sm ring-1 ring-border/80",
  active: "bg-accent text-accent-foreground shadow-sm",
  done: "bg-[var(--success)] text-white shadow-sm",
};

export const LEISURE_TYPES: {
  value: LeisureType;
  label: string;
  labelFa: string;
}[] = [
  { value: "book", label: "Book", labelFa: "کتاب" },
  { value: "audiobook", label: "Audiobook", labelFa: "کتاب صوتی" },
  { value: "podcast", label: "Podcast", labelFa: "پادکست" },
  { value: "movie", label: "Movie", labelFa: "فیلم" },
  { value: "series", label: "Series", labelFa: "سریال" },
  { value: "game", label: "Game", labelFa: "بازی" },
  { value: "place", label: "Place", labelFa: "مکان" },
];

export const TYPE_COLORS: Record<LeisureType, string> = {
  book: "bg-[var(--tag-book-bg)] text-[var(--tag-book)]",
  audiobook: "bg-[var(--tag-audiobook-bg)] text-[var(--tag-audiobook)]",
  podcast: "bg-[var(--tag-podcast-bg)] text-[var(--tag-podcast)]",
  movie: "bg-[var(--tag-movie-bg)] text-[var(--tag-movie)]",
  series: "bg-[var(--tag-series-bg)] text-[var(--tag-series)]",
  game: "bg-[var(--tag-game-bg)] text-[var(--tag-game)]",
  place: "bg-[var(--tag-place-bg)] text-[var(--tag-place)]",
};

export function getTypeLabel(type: LeisureType): string {
  return LEISURE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function emptyTypeCounts(): Record<LeisureType | "all", number> {
  const counts = { all: 0 } as Record<LeisureType | "all", number>;
  for (const t of LEISURE_TYPES) counts[t.value] = 0;
  return counts;
}
