import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export async function requireAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getOrCreateProfile() {
  const clerkUserId = await requireAuthUserId();
  const db = getDb();

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, clerkUserId),
  });

  if (existing) return existing;

  const user = await currentUser();
  const [created] = await db
    .insert(profiles)
    .values({
      clerkUserId,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      name: user?.fullName ?? user?.username ?? null,
      imageUrl: user?.imageUrl ?? null,
    })
    .returning();

  return created;
}

export async function syncProfileFromClerk() {
  const clerkUserId = await requireAuthUserId();
  const user = await currentUser();
  if (!user) return null;

  const db = getDb();
  const [updated] = await db
    .insert(profiles)
    .values({
      clerkUserId,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: user.fullName ?? user.username ?? null,
      imageUrl: user.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: profiles.clerkUserId,
      set: {
        email: user.primaryEmailAddress?.emailAddress ?? null,
        name: user.fullName ?? user.username ?? null,
        imageUrl: user.imageUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}
