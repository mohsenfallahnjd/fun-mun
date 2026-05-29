import type { LeisureItem, LeisureType } from "./types";

export function pickSuggestion(
  items: LeisureItem[],
  preferredTypes?: LeisureType[] | null,
): LeisureItem | null {
  const pool = items.filter((item) => {
    if (item.status === "done") return false;
    if (preferredTypes?.length && !preferredTypes.includes(item.type)) {
      return false;
    }
    return true;
  });

  if (pool.length === 0) return null;

  const active = pool.filter((i) => i.status === "active");
  if (active.length > 0) {
    return active[Math.floor(Math.random() * active.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
