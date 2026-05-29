import type { LeisureItem, LeisureStatus } from "./types";

export type SortMode = "manual" | "newest" | "oldest" | "title" | "status";

export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "manual", label: "Custom" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A–Z" },
  { value: "status", label: "Status" },
];

const STATUS_RANK: Record<LeisureStatus, number> = {
  active: 0,
  queue: 1,
  done: 2,
};

const SORT_KEY = "fun-mun-sort";

export function loadSortMode(): SortMode {
  if (typeof window === "undefined") return "manual";
  const stored = localStorage.getItem(SORT_KEY);
  if (SORT_OPTIONS.some((o) => o.value === stored)) return stored as SortMode;
  return "manual";
}

export function saveSortMode(mode: SortMode): void {
  localStorage.setItem(SORT_KEY, mode);
}

export function withDefaultOrder(items: LeisureItem[]): LeisureItem[] {
  return items.map((item, index) => ({
    ...item,
    order: item.order ?? index,
  }));
}

export function sortItems(items: LeisureItem[], mode: SortMode): LeisureItem[] {
  const copy = [...items];

  switch (mode) {
    case "manual":
      return copy.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "title":
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    case "status":
      return copy.sort((a, b) => {
        const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (byStatus !== 0) return byStatus;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }
}

export function reorderItems(
  items: LeisureItem[],
  activeId: string,
  overId: string,
): LeisureItem[] {
  const sorted = sortItems(withDefaultOrder(items), "manual");
  const from = sorted.findIndex((i) => i.id === activeId);
  const to = sorted.findIndex((i) => i.id === overId);
  if (from === -1 || to === -1 || from === to) return items;

  const [moved] = sorted.splice(from, 1);
  sorted.splice(to, 0, moved);

  return sorted.map((item, index) => ({ ...item, order: index }));
}
