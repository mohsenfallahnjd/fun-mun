import { NextResponse } from "next/server";
import { requireAuthUserId } from "@/lib/auth";
import { followUser, getProfileByUsername, unfollowUser } from "@/lib/profile-service";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(_request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const followerId = await requireAuthUserId();
    const { username } = await context.params;
    const profile = await getProfileByUsername(username);

    if (!profile?.isPublic) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await followUser(followerId, profile.id);
    return NextResponse.json({ following: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Sign in to follow" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const followerId = await requireAuthUserId();
    const { username } = await context.params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await unfollowUser(followerId, profile.id);
    return NextResponse.json({ following: false });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
  }
}
