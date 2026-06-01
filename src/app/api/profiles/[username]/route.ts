import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getFollowerCount,
  getFollowingCount,
  getProfileByUsername,
  isFollowing,
  listPublicItems,
} from "@/lib/profile-service";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { username } = await context.params;

  try {
    const profile = await getProfileByUsername(username);
    if (!profile?.isPublic) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const session = await auth();
    const items = await listPublicItems(profile.id);
    const followerCount = await getFollowerCount(profile.id);
    const followingCount = await getFollowingCount(profile.id);
    const following =
      session?.user?.id && session.user.id !== profile.id
        ? await isFollowing(session.user.id, profile.id)
        : false;

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        imageUrl: profile.imageUrl,
        followerCount,
        followingCount,
        itemCount: items.length,
        isOwn: session?.user?.id === profile.id,
      },
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        imageUrl: item.imageUrl,
        status: item.status,
        year: item.year,
        progress: item.progress,
      })),
      following,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
