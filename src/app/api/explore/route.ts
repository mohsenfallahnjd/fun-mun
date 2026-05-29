import { NextResponse } from "next/server";
import { getCachedExploreSections } from "@/lib/explore-cache";

export const revalidate = 3600;

export async function GET() {
  try {
    const sections = await getCachedExploreSections();
    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ sections: [] }, { status: 500 });
  }
}
