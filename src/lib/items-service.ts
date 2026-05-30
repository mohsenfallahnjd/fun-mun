import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leisureItems } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/auth";
import { itemToInsertRow, normalizeItemsForSave, rowToItem } from "@/lib/items-mapper";
import type { LeisureItem } from "@/lib/types";

const INSERT_CHUNK_SIZE = 50;

export async function countUserItems(): Promise<number> {
  const profile = await getOrCreateProfile();
  const db = getDb();
  const [result] = await db
    .select({ value: count() })
    .from(leisureItems)
    .where(eq(leisureItems.userId, profile.id));
  return result?.value ?? 0;
}

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
  const normalized = normalizeItemsForSave(items);

  if (normalized.length === 0) {
    const existing = await listUserItems();
    if (existing.length > 0) return existing;
    return [];
  }

  const rows = normalized.map((item) => itemToInsertRow(item, profile.id));
  const chunks: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + INSERT_CHUNK_SIZE));
  }

  // neon-http has no interactive transactions — use Neon's batch API instead.
  await db.batch([
    db.delete(leisureItems).where(eq(leisureItems.userId, profile.id)),
    ...chunks.map((chunk) => db.insert(leisureItems).values(chunk)),
  ]);

  return listUserItems();
}
