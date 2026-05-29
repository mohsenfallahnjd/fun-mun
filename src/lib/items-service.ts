import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leisureItems } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import { rowToItem } from "@/lib/items-mapper";
import type { LeisureItem } from "@/lib/types";

export async function listUserItems(): Promise<LeisureItem[]> {
  const profile = await getOrCreateProfile();
  const db = getDb();
  const rows = await db.query.leisureItems.findMany({
    where: eq(leisureItems.userId, profile.id),
  });
  return rows.map(rowToItem);
}

export async function replaceUserItems(items: LeisureItem[]): Promise<LeisureItem[]> {
  const profile = await getOrCreateProfile();
  const db = getDb();

  await db.delete(leisureItems).where(eq(leisureItems.userId, profile.id));

  if (items.length === 0) return [];

  const inserted = await db
    .insert(leisureItems)
    .values(
      items.map((item) => ({
        id: item.id,
        userId: profile.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle ?? null,
        imageUrl: item.imageUrl ?? null,
        watchUrl: item.watchUrl ?? null,
        notes: item.notes ?? null,
        status: item.status,
        year: item.year ?? null,
        progress: item.progress ?? null,
        order: item.order ?? null,
        createdAt: new Date(item.createdAt),
      })),
    )
    .returning();

  return inserted.map(rowToItem);
}
