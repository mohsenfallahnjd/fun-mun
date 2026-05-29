import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSessionProfile, requireAuthUserId } from "@/lib/auth";
import { countUserItems } from "@/lib/items-service";
import { slugifyUsername } from "@/lib/profile-service";
import { isThemeId } from "@/lib/themes";

function dbUnavailable() {
  return NextResponse.json({ error: "Database not configured" }, { status: 503 });
}

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const profile = await getSessionProfile();
    const itemCount = await countUserItems();
    return NextResponse.json({
      profile: {
        id: profile?.id,
        name: profile?.name,
        email: profile?.email,
        username: profile?.username,
        bio: profile?.bio,
        isPublic: profile?.isPublic,
        imageUrl: profile?.imageUrl,
        theme: profile?.theme,
        itemCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const userId = await requireAuthUserId();
    const body = (await request.json()) as {
      username?: string;
      bio?: string;
      isPublic?: boolean;
      name?: string;
      imageUrl?: string | null;
      theme?: string;
    };

    const updates: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updates.name = body.name.trim() || null;
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio.trim() || null;
    }
    if (body.imageUrl !== undefined) {
      updates.imageUrl = body.imageUrl?.trim() || null;
    }
    if (body.theme !== undefined) {
      if (!isThemeId(body.theme)) {
        return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
      }
      updates.theme = body.theme;
    }
    if (body.isPublic !== undefined) {
      updates.isPublic = body.isPublic;
    }
    if (body.username !== undefined) {
      const username = slugifyUsername(body.username);
      if (username.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters (letters, numbers, underscore)" },
          { status: 400 },
        );
      }
      const db = getDb();
      const taken = await db.query.profiles.findFirst({
        where: eq(profiles.username, username),
      });
      if (taken && taken.id !== userId) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
      updates.username = username;
    }

    const db = getDb();
    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, userId))
      .returning();

    return NextResponse.json({ profile: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
