import { type NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/search-games";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchGames(q);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
