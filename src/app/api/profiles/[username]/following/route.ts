import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfileByUsername, listFollowing } from "@/lib/profile-service";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { username } = await context.params;

  try {
    const profile = await getProfileByUsername(username);
    const session = await auth();
    const isOwn = session?.user?.id === profile?.id;

    if (!profile || (!profile.isPublic && !isOwn)) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profiles = await listFollowing(profile.id, { publicOnly: !isOwn });
    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: "Failed to load following" }, { status: 500 });
  }
}
