import { NextResponse } from "next/server";
import { syncProfileFromClerk } from "@/lib/auth";
import { listUserItems } from "@/lib/items-service";

function dbUnavailable() {
  return NextResponse.json({ error: "Database not configured" }, { status: 503 });
}

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable();

  try {
    const profile = await syncProfileFromClerk();
    const items = await listUserItems();
    return NextResponse.json({
      profile: {
        id: profile?.id,
        name: profile?.name,
        email: profile?.email,
        imageUrl: profile?.imageUrl,
        itemCount: items.length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
