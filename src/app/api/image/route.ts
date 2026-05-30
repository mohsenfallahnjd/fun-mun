import { type NextRequest, NextResponse } from "next/server";
import { isSafeRemoteImageUrl, MAX_IMAGE_BYTES } from "@/lib/image-proxy";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 12_000;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isSafeRemoteImageUrl(url)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "FunMun/1.0 ImageProxy",
      },
      next: { revalidate: 86_400 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }

    const contentLength = upstream.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
