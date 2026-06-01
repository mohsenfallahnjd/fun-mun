import type { ProfileSummary } from "@/lib/profile-types";
import type { PublicItemPayload } from "@/lib/public-item-types";
import type { LeisureProgress, LeisureStatus, LeisureType } from "@/lib/types";

export interface ProfileResponse {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  isPublic?: boolean;
  imageUrl?: string | null;
  theme?: string | null;
  itemCount?: number;
}

export interface PublicProfileData {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  followerCount: number;
  followingCount: number;
  itemCount: number;
  isOwn: boolean;
}

export interface PublicProfilePayload {
  profile: PublicProfileData;
  items: {
    id: string;
    type: LeisureType;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    status: LeisureStatus;
    year?: number;
    progress?: LeisureProgress;
  }[];
  following: boolean;
}

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

function writeCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() });
}

function clearKeys(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

async function fetchDeduped<T>(key: string, url: string, force = false): Promise<T | null> {
  if (!force) {
    const cached = readCache<T>(key);
    if (cached) return cached;

    const pending = inflight.get(key) as Promise<T | null> | undefined;
    if (pending) return pending;
  } else {
    cache.delete(key);
    inflight.delete(key);
  }

  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as T;
    })
    .then((data) => {
      if (data !== null) writeCache(key, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

let cachedProfile: ProfileResponse | null | undefined;
let inflightProfile: Promise<ProfileResponse | null> | null = null;

export function invalidateProfileCache(): void {
  cachedProfile = undefined;
  inflightProfile = null;
}

export function invalidateMeFollowingCache(): void {
  clearKeys("me:following");
}

export function invalidatePublicProfileCache(username: string): void {
  const slug = username.toLowerCase();
  clearKeys(`public:${slug}`);
}

export async function fetchProfile(force = false): Promise<ProfileResponse | null> {
  if (!force && cachedProfile !== undefined) {
    return cachedProfile;
  }
  if (!force && inflightProfile) {
    return inflightProfile;
  }

  inflightProfile = fetch("/api/profile")
    .then(async (res) => {
      if (res.status === 401) {
        cachedProfile = null;
        return null;
      }
      if (!res.ok) {
        cachedProfile = null;
        return null;
      }
      const data = (await res.json()) as { profile?: ProfileResponse };
      cachedProfile = data.profile ?? null;
      return cachedProfile;
    })
    .catch(() => {
      cachedProfile = null;
      return null;
    })
    .finally(() => {
      inflightProfile = null;
    });

  return inflightProfile;
}

export async function fetchMeFollowing(force = false): Promise<ProfileSummary[]> {
  const data = await fetchDeduped<{ profiles: ProfileSummary[] }>(
    "me:following",
    "/api/me/following",
    force,
  );
  return data?.profiles ?? [];
}

export async function fetchPublicProfile(
  username: string,
  force = false,
): Promise<PublicProfilePayload | null> {
  const slug = username.toLowerCase();
  return fetchDeduped<PublicProfilePayload>(
    `public:${slug}`,
    `/api/profiles/${encodeURIComponent(slug)}`,
    force,
  );
}

export async function fetchProfilePeople(
  username: string,
  kind: "followers" | "following",
  force = false,
): Promise<ProfileSummary[]> {
  const slug = username.toLowerCase();
  const data = await fetchDeduped<{ profiles: ProfileSummary[] }>(
    `public:${slug}:${kind}`,
    `/api/profiles/${encodeURIComponent(slug)}/${kind}`,
    force,
  );
  return data?.profiles ?? [];
}

export async function fetchPublicItem(
  username: string,
  itemId: string,
  force = false,
): Promise<PublicItemPayload | null> {
  const slug = username.toLowerCase();
  return fetchDeduped(
    `public:${slug}:item:${itemId}`,
    `/api/profiles/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}`,
    force,
  );
}

export async function patchProfile(body: Record<string, unknown>): Promise<Response> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    invalidateProfileCache();
  }
  return res;
}
