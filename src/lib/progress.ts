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
    case "game":
      if (p.hoursPlayed != null) return `${p.hoursPlayed}h played`;
      return null;
    default:
      return null;
  }
}

export function progressFieldsForType(type: LeisureType): {
  pages: boolean;
  time: boolean;
  episode: boolean;
  hours: boolean;
} {
  return {
    pages: type === "book" || type === "audiobook",
    time: type === "movie",
    episode: type === "series" || type === "podcast",
    hours: type === "game",
  };
}

export function canAdvanceProgress(item: LeisureItem): boolean {
  if (item.status !== "active") return false;
  const fields = progressFieldsForType(item.type);
  return fields.pages || fields.episode || fields.time;
}

export function nextProgressLabel(item: LeisureItem): string {
  switch (item.type) {
    case "book":
    case "audiobook":
      return "Next page";
    case "series":
    case "podcast":
      return "Next ep";
    case "movie":
      return "+15 min";
    default:
      return "Next";
  }
}

export function advanceProgress(item: LeisureItem): LeisureProgress | null {
  const fields = progressFieldsForType(item.type);
  const p: LeisureProgress = { ...item.progress };

  if (fields.pages) {
    p.page = (p.page ?? 0) + 1;
    return p;
  }

  if (fields.episode) {
    if (p.season != null || p.episode != null) {
      p.season = p.season ?? 1;
      p.episode = (p.episode ?? 0) + 1;
    } else {
      p.season = 1;
      p.episode = 1;
    }
    return p;
  }

  if (fields.time) {
    p.watchedMinutes = (p.watchedMinutes ?? 0) + 15;
    return p;
  }

  return null;
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

export function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number.parseFloat(trimmed);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}
