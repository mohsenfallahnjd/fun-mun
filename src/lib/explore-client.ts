import { exploreItemApiPath } from "@/lib/explore-id";
import type { ExploreItemDetail, ExplorePageResult, ExploreSection } from "@/lib/explore-service";
import type { LeisureType } from "@/lib/types";

const CACHE_TTL_MS = 60_000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

async function fetchDeduped<T>(key: string, url: string, signal?: AbortSignal): Promise<T> {
  const cached = readCache<T>(key);
  if (cached) return cached;

  let promise = inflight.get(key) as Promise<T> | undefined;
  if (!promise) {
    promise = fetch(url, { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${url}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        cache.set(key, { data, ts: Date.now() });
        return data;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, promise);
  }

  return promise;
}

export function fetchExploreSections(signal?: AbortSignal): Promise<ExploreSection[]> {
  return fetchDeduped<{ sections: ExploreSection[] }>(
    "explore:sections",
    "/api/explore",
    signal,
  ).then((data) => data.sections ?? []);
}

export function fetchExploreCategoryPage(
  type: LeisureType,
  page: number,
  signal?: AbortSignal,
): Promise<ExplorePageResult> {
  const key = `explore:${type}:page:${page}`;
  const url = `/api/explore/${type}?page=${page}`;
  return fetchDeduped<ExplorePageResult>(key, url, signal);
}

export function fetchExploreCategorySearch(
  type: LeisureType,
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<ExplorePageResult> {
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();
  const key = `explore:${type}:search:${normalized}:${page}`;
  const url = `/api/explore/${type}?q=${encodeURIComponent(trimmed)}&page=${page}`;
  return fetchDeduped<ExplorePageResult>(key, url, signal);
}

export function fetchExploreItemDetail(
  type: LeisureType,
  id: string,
  signal?: AbortSignal,
): Promise<ExploreItemDetail> {
  const key = `explore:${type}:item:${id}`;
  const url = exploreItemApiPath(type, id);
  return fetchDeduped<{ item: ExploreItemDetail }>(key, url, signal).then((data) => data.item);
}

export function invalidateExploreCache(): void {
  cache.clear();
  inflight.clear();
}
