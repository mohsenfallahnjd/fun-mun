import type { LeisureItem, LeisureProgress, LeisureType } from "./types";

export type { LeisureProgress };

export function formatProgress(item: LeisureItem): string | null {
  const p = item.progress;
  if (!p) return null;

  switch (item.type) {
    case "book":
    case "audiobook":
      if (p.page != null && p.totalPages != null) return `p. ${p.page} / ${p.totalPages}`;
      if (p.page != null) return `p. ${p.page}`;
      return null;
    case "movie":
      if (p.watchedMinutes != null && p.totalMinutes != null) {
        return `${p.watchedMinutes} / ${p.totalMinutes} min`;
      }
      if (p.watchedMinutes != null) return `${p.watchedMinutes} min watched`;
      return null;
    case "series":
    case "podcast":
      if (p.season != null && p.episode != null) return `S${p.season} E${p.episode}`;
      if (p.episode != null) return `Ep. ${p.episode}`;
      return null;
    default:
      return null;
  }
}

export function progressFieldsForType(type: LeisureType): {
  pages: boolean;
  time: boolean;
  episode: boolean;
} {
  return {
    pages: type === "book" || type === "audiobook",
    time: type === "movie",
    episode: type === "series" || type === "podcast",
  };
}

export function emptyProgress(): LeisureProgress {
  return {};
}

export function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}
