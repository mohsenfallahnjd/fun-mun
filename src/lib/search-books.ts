import { googleBooksRating, openLibraryRating } from "@/lib/rating";
import type { SearchResult } from "@/lib/types";

function goodreadsUrl(isbn?: string, title?: string, author?: string): string | undefined {
  if (isbn) return `https://www.goodreads.com/book/isbn/${isbn}`;
  if (title) {
    const q = author ? `${title} ${author}` : title;
    return `https://www.goodreads.com/search?q=${encodeURIComponent(q)}`;
  }
  return undefined;
}

function dedupeKey(result: SearchResult): string {
  return `${result.title.toLowerCase()}|${(result.subtitle ?? "").toLowerCase()}`;
}

async function searchOpenLibrary(q: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=title,author_name,cover_i,first_publish_year,key,ratings_average,isbn`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      first_publish_year?: number;
      ratings_average?: number;
      isbn?: string[];
    }>;
  };

  return (data.docs ?? []).flatMap((doc) => {
    if (!doc.title) return [];
    const isbn = doc.isbn?.[0];
    const author = doc.author_name?.join(", ");
    return [
      {
        id: doc.key ?? doc.title,
        title: doc.title,
        subtitle: author,
        imageUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        year: doc.first_publish_year,
        sourceUrl:
          goodreadsUrl(isbn, doc.title, author) ??
          (doc.key ? `https://openlibrary.org${doc.key}` : undefined),
        rating: openLibraryRating(doc.ratings_average),
      },
    ];
  });
}

async function searchGoogleBooks(q: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${limit}&printType=books`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        publishedDate?: string;
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
        averageRating?: number;
        infoLink?: string;
      };
    }>;
  };

  return (data.items ?? []).flatMap((entry) => {
    const info = entry.volumeInfo;
    if (!info?.title) return [];

    const isbn =
      info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier ??
      info.industryIdentifiers?.find((id) => id.type === "ISBN_10")?.identifier;
    const author = info.authors?.join(", ");
    const year = info.publishedDate
      ? Number.parseInt(info.publishedDate.slice(0, 4), 10)
      : undefined;

    return [
      {
        id: entry.id ?? info.title,
        title: info.title,
        subtitle: author,
        imageUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        year: Number.isFinite(year) ? year : undefined,
        sourceUrl: goodreadsUrl(isbn, info.title, author) ?? info.infoLink,
        rating: info.averageRating ? googleBooksRating(info.averageRating) : undefined,
      },
    ];
  });
}

/** Merged book search — Open Library + Google Books, Goodreads links when ISBN is known. */
export async function searchBooks(q: string, limit = 8): Promise<SearchResult[]> {
  const perSource = Math.ceil(limit / 2);
  const [openLibrary, googleBooks] = await Promise.all([
    searchOpenLibrary(q, perSource),
    searchGoogleBooks(q, perSource),
  ]);

  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  for (const result of [...openLibrary, ...googleBooks]) {
    const key = dedupeKey(result);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(result);
    if (merged.length >= limit) break;
  }

  return merged;
}
