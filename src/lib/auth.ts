import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export async function requireAuthUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getProfileById(userId: string) {
  const db = getDb();
  return db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
}

export async function getOrCreateProfile() {
  const userId = await requireAuthUserId();
  const profile = await getProfileById(userId);
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
}

export async function getSessionProfile() {
  return getOrCreateProfile();
}
