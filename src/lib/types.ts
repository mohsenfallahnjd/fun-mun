export type LeisureType = "book" | "audiobook" | "podcast" | "movie" | "series" | "place";

export type LeisureStatus = "queue" | "active" | "done";

export interface LeisureProgress {
  page?: number;
  totalPages?: number;
  watchedMinutes?: number;
  totalMinutes?: number;
  season?: number;
  episode?: number;
}

export interface LeisureItem {
  id: string;
  type: LeisureType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  watchUrl?: string;
  notes?: string;
  status: LeisureStatus;
  year?: number;
  progress?: LeisureProgress;
  order?: number;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  year?: number;
  sourceUrl?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  hint?: "missing_tmdb_key" | "no_results";
}

export const STATUS_OPTIONS: { value: LeisureStatus; label: string }[] = [
  { value: "queue", label: "Queue" },
  { value: "active", label: "In progress" },
  { value: "done", label: "Done" },
];

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
  { value: "place", label: "Place", labelFa: "مکان" },
];

export const TYPE_COLORS: Record<LeisureType, string> = {
  book: "bg-[var(--tag-book-bg)] text-[var(--tag-book)]",
  audiobook: "bg-[var(--tag-audiobook-bg)] text-[var(--tag-audiobook)]",
  podcast: "bg-[var(--tag-podcast-bg)] text-[var(--tag-podcast)]",
  movie: "bg-[var(--tag-movie-bg)] text-[var(--tag-movie)]",
  series: "bg-[var(--tag-series-bg)] text-[var(--tag-series)]",
  place: "bg-[var(--tag-place-bg)] text-[var(--tag-place)]",
};
