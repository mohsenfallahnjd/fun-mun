import { unstable_cache } from "next/cache";
import {
  fetchExploreItem,
  fetchExplorePage,
  fetchExploreSections,
  searchExploreCategory,
} from "@/lib/explore-service";
import type { LeisureType } from "@/lib/types";

export function getCachedExploreSections() {
  return unstable_cache(() => fetchExploreSections(), ["explore-sections"], {
    revalidate: 3600,
  })();
}

export function getCachedExplorePage(type: LeisureType, page: number) {
  return unstable_cache(() => fetchExplorePage(type, page), ["explore-page", type, String(page)], {
    revalidate: 3600,
  })();
}

export function getCachedExploreSearch(type: LeisureType, query: string, page: number) {
  const normalized = query.trim().toLowerCase();
  return unstable_cache(
    () => searchExploreCategory(type, query, page),
    ["explore-search", type, normalized, String(page)],
    { revalidate: 3600 },
  )();
}

export function getCachedExploreItem(type: LeisureType, id: string) {
  return unstable_cache(() => fetchExploreItem(type, id), ["explore-item-v2", type, id], {
    revalidate: 3600,
  })();
}
