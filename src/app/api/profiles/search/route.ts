import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPublicProfiles } from "@/lib/profile-service";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ profiles: [] });
  }

  try {
    const session = await auth();
    const profiles = await searchPublicProfiles(q, session?.user?.id);
    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
