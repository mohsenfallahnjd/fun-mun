import type { DbLeisureItem } from "@/db/schema";
import type { ContentRating } from "@/lib/rating";
import {
  LEISURE_TYPES,
  type LeisureItem,
  type LeisureProgress,
  type LeisureStatus,
  type LeisureType,
  STATUS_OPTIONS,
} from "@/lib/types";

const VALID_TYPES = new Set<LeisureType>(LEISURE_TYPES.map((t) => t.value));
const VALID_STATUS = new Set<LeisureStatus>(STATUS_OPTIONS.map((s) => s.value));

function parseCreatedAt(value: string | undefined): Date {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function normalizeItemsForSave(items: LeisureItem[]): LeisureItem[] {
  const byId = new Map<string, LeisureItem>();

  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;

    const id = typeof raw.id === "string" ? raw.id.trim() : String(raw.id ?? "").trim();
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!id || !title) continue;

    const type = VALID_TYPES.has(raw.type) ? raw.type : "book";
    const status = VALID_STATUS.has(raw.status) ? raw.status : "queue";

    byId.set(id, {
      ...raw,
      id,
      title,
      type,
      status,
      createdAt: parseCreatedAt(raw.createdAt).toISOString(),
      year: typeof raw.year === "number" && Number.isFinite(raw.year) ? raw.year : undefined,
      order: typeof raw.order === "number" && Number.isFinite(raw.order) ? raw.order : undefined,
      releaseDate: typeof raw.releaseDate === "string" ? raw.releaseDate : undefined,
      releaseReminderEnabled: Boolean(raw.releaseReminderEnabled),
    });
  }

  return Array.from(byId.values());
}

/** Add incoming items without overwriting existing ids (for local → cloud merge). */
export function mergeItemLists(incoming: LeisureItem[], existing: LeisureItem[]): LeisureItem[] {
  const byId = new Map<string, LeisureItem>();
  for (const item of existing) byId.set(item.id, item);
  for (const item of normalizeItemsForSave(incoming)) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

export function itemToInsertRow(item: LeisureItem, userId: string) {
  return {
    id: item.id,
    userId,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle ?? null,
    imageUrl: item.imageUrl ?? null,
    watchUrl: item.watchUrl ?? null,
    notes: item.notes ?? null,
    originalTitle: item.originalTitle ?? null,
    status: item.status,
    year: item.year ?? null,
    rating: item.rating ?? null,
    progress: item.progress ?? null,
    order: item.order ?? null,
    releaseDate: item.releaseDate ?? null,
    releaseReminderEnabled: item.releaseReminderEnabled ?? false,
    createdAt: parseCreatedAt(item.createdAt),
  };
}

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
    releaseDate: row.releaseDate ?? undefined,
    releaseReminderEnabled: row.releaseReminderEnabled ?? undefined,
  };
}
