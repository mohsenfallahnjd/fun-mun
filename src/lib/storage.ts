import { SEED_ITEMS } from "./seed-data";
import { withDefaultOrder } from "./sort";
import type { LeisureItem } from "./types";

const STORAGE_KEY = "fun-mun-leisure-items";

export function loadItems(): LeisureItem[] {
  if (typeof window === "undefined") return SEED_ITEMS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS));
      return SEED_ITEMS;
    }
    return withDefaultOrder(JSON.parse(raw) as LeisureItem[]);
  } catch {
    return SEED_ITEMS;
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
