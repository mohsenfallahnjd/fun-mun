import { NextResponse } from "next/server";
import { requireAuthUserId } from "@/lib/auth";
import { listFollowing } from "@/lib/profile-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAuthUserId();
    const profiles = await listFollowing(userId);
    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
}
