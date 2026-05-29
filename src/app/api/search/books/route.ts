import { type NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,cover_i,first_publish_year,key`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        cover_i?: number;
        first_publish_year?: number;
      }>;
    };

    const results: SearchResult[] = (data.docs ?? []).flatMap((doc) => {
      if (!doc.title) return [];
      return [
        {
          id: doc.key ?? doc.title,
          title: doc.title,
          subtitle: doc.author_name?.join(", "),
          imageUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : undefined,
          year: doc.first_publish_year,
          sourceUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        },
      ];
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
