import { type NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview, isValidHttpUrl } from "@/lib/link-preview";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();

  if (!url || !isValidHttpUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);

  if (!preview) {
    return NextResponse.json({ error: "Could not fetch preview" }, { status: 422 });
  }

  return NextResponse.json(preview);
}
