import { NextResponse } from "next/server";
import { lookupGenres } from "@/lib/genres";
import { authorizeIntegration } from "@/lib/integration";
import { listPublicItems } from "@/lib/profile-service";

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const profile = await authorizeIntegration(request);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await listPublicItems(profile.id);
    const withGenres = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        originalTitle: item.originalTitle,
        subtitle: item.subtitle,
        notes: item.notes,
        status: item.status,
        year: item.year,
        rating: item.rating,
        progress: item.progress,
        genres: await lookupGenres(item),
      })),
    );
    return NextResponse.json({ items: withGenres });
  } catch {
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}
