import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPublicItem } from "@/lib/profile-service";

type RouteContext = { params: Promise<{ username: string; itemId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { username, itemId } = await context.params;

  try {
    const result = await getPublicItem(username, itemId);
    if (!result) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const session = await auth();
    const { profile, item } = result;

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        imageUrl: profile.imageUrl,
        isOwn: session?.user?.id === profile.id,
      },
      item: {
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        originalTitle: item.originalTitle,
        imageUrl: item.imageUrl,
        watchUrl: item.watchUrl,
        notes: item.notes,
        status: item.status,
        year: item.year,
        rating: item.rating,
        progress: item.progress,
        createdAt: item.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}
