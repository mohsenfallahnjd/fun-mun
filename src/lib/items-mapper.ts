import type { DbLeisureItem } from "@/db/schema";
import type { ContentRating } from "@/lib/rating";
import type { LeisureItem, LeisureProgress, LeisureStatus, LeisureType } from "@/lib/types";

export function rowToItem(row: DbLeisureItem): LeisureItem {
  return {
    id: row.id,
    type: row.type as LeisureType,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    watchUrl: row.watchUrl ?? undefined,
    notes: row.notes ?? undefined,
    originalTitle: row.originalTitle ?? undefined,
    status: row.status as LeisureStatus,
    year: row.year ?? undefined,
    rating: (row.rating as ContentRating | null) ?? undefined,
    progress: (row.progress as LeisureProgress | null) ?? undefined,
    order: row.order ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
