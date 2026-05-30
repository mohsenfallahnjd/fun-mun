import { withDefaultOrder } from "./sort";
import type { LeisureItem } from "./types";

const STORAGE_KEY = "fun-mun-leisure-items";

export function loadItems(): LeisureItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return withDefaultOrder(JSON.parse(raw) as LeisureItem[]);
  } catch {
    return [];
  }
}

export function clearItems(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveItems(items: LeisureItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function exportItems(items: LeisureItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function importItems(json: string): LeisureItem[] {
  const parsed = JSON.parse(json) as LeisureItem[];
  if (!Array.isArray(parsed)) throw new Error("Invalid format");
  saveItems(parsed);
  return parsed;
}

/** Local items whose ids are not in the synced cloud list (guest/import leftovers). */
export function countUnmergedLocalItems(cloudItems: LeisureItem[]): number {
  const local = loadItems();
  if (local.length === 0) return 0;
  const cloudIds = new Set(cloudItems.map((item) => item.id));
  return local.filter((item) => !cloudIds.has(item.id)).length;
}
