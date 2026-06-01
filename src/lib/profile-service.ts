import { and, count, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { follows, leisureItems, profiles } from "@/db/schema";
import { rowToItem } from "@/lib/items-mapper";
import type { LeisureItem } from "@/lib/types";

export function slugifyUsername(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  return slug || "user";
}

export async function generateUniqueUsername(base: string): Promise<string> {
  const db = getDb();
  const root = slugifyUsername(base);
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? root : `${root}${i}`;
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.username, candidate),
    });
    if (!existing) return candidate;
  }
  return `${root}${Date.now().toString(36).slice(-4)}`;
}

export async function getProfileByUsername(username: string) {
  const db = getDb();
  return db.query.profiles.findFirst({
    where: eq(profiles.username, username.toLowerCase()),
  });
}

export async function searchPublicProfiles(query: string, excludeUserId?: string) {
  const db = getDb();
  const pattern = `%${query.trim()}%`;

  const conditions: SQL[] = [
    eq(profiles.isPublic, true),
    or(ilike(profiles.username, pattern), ilike(profiles.name, pattern)) as SQL,
  ];
  if (excludeUserId) conditions.push(ne(profiles.id, excludeUserId));

  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      username: profiles.username,
      bio: profiles.bio,
      imageUrl: profiles.imageUrl,
    })
    .from(profiles)
    .where(and(...conditions))
    .limit(20);

  return rows.filter((r) => r.username);
}

export async function getFollowerCount(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.followingId, userId));
  return row?.value ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return row?.value ?? 0;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
  });
  return Boolean(row);
}

export async function listPublicItems(userId: string) {
  const db = getDb();
  const rows = await db.query.leisureItems.findMany({
    where: eq(leisureItems.userId, userId),
  });
  return rows.map(rowToItem);
}

export async function getPublicItem(
  username: string,
  itemId: string,
): Promise<{ profile: typeof profiles.$inferSelect; item: LeisureItem } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile?.isPublic || !profile.username) return null;

  const db = getDb();
  const row = await db.query.leisureItems.findFirst({
    where: and(eq(leisureItems.userId, profile.id), eq(leisureItems.id, itemId)),
  });

  if (!row) return null;
  return { profile, item: rowToItem(row) };
}

export async function listFollowing(followerId: string, options?: { publicOnly?: boolean }) {
  const db = getDb();
  const conditions = [eq(follows.followerId, followerId)];
  if (options?.publicOnly) conditions.push(eq(profiles.isPublic, true));

  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      username: profiles.username,
      bio: profiles.bio,
      imageUrl: profiles.imageUrl,
    })
    .from(follows)
    .innerJoin(profiles, eq(follows.followingId, profiles.id))
    .where(and(...conditions));

  return rows.filter((row) => row.username);
}

export async function listFollowers(followingId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      username: profiles.username,
      bio: profiles.bio,
      imageUrl: profiles.imageUrl,
    })
    .from(follows)
    .innerJoin(profiles, eq(follows.followerId, profiles.id))
    .where(and(eq(follows.followingId, followingId), eq(profiles.isPublic, true)));

  return rows.filter((row) => row.username);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  const db = getDb();
  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
  });
  if (existing) return;
  await db.insert(follows).values({ followerId, followingId });
}

export async function unfollowUser(followerId: string, followingId: string) {
  const db = getDb();
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}
