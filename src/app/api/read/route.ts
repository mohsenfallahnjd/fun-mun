import { type NextRequest, NextResponse } from "next/server";
import { articleReaderDocument, extractReadableArticle } from "@/lib/article-reader";
import { fetchLinkPreview } from "@/lib/link-preview";
import { isSafeRemoteUrl } from "@/lib/url-safety";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  if (!url || !isSafeRemoteUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FunMunReader/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Could not load article" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 415 });
    }

    const html = await res.text();
    const preview = await fetchLinkPreview(url);
    const title = preview?.title ?? new URL(url).hostname;
    const content = extractReadableArticle(html, url);
    const document = articleReaderDocument(title, content, url);

    return new NextResponse(document, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
