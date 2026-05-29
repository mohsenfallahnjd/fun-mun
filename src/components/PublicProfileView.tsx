"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Image } from "@/components/Image";
import { Loader2, Pencil, Share2, UserMinus, UserPlus } from "@/components/icons";
import { Link } from "@/components/Link";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import type { LeisureType } from "@/lib/types";

interface PublicProfile {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  followerCount: number;
  itemCount: number;
  isOwn: boolean;
}

interface PublicItem {
  id: string;
  type: LeisureType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  status: string;
  year?: number;
}

export function PublicProfileView() {
  const params = useParams();
  const username = params.username as string;
  const { status } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(username)}`);
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as {
        profile: PublicProfile;
        items: PublicItem[];
        following: boolean;
      };
      setProfile(data.profile);
      setItems(data.items);
      setFollowing(data.following);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (status !== "authenticated") {
      window.location.href = "/sign-in";
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(username)}/follow`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowing(!following);
        await load();
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `@${username} on Fun Mun`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Profile not found or is private.</p>
        <Link href="/discover" className="mt-4 inline-block font-medium">
          Discover people
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <AppHeader />

      <header className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.name ?? profile.username}</h1>
            <p className="text-muted">@{profile.username}</p>
            {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
            <p className="mt-3 text-sm text-muted">
              {profile.itemCount} items · {profile.followerCount} followers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={share}
              className="rounded-xl border border-border p-2.5 text-muted hover:bg-muted/40"
              title="Share profile"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {profile.isOwn ? (
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium no-underline hover:bg-muted/40"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
              >
                {following ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Leisure list</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No items yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <TypeAvatar type={item.type} />
                  )}
                </div>
                <div className="min-w-0">
                  <TypeBadge type={item.type} />
                  <p className="mt-1 font-semibold">{item.title}</p>
                  {item.subtitle && <p className="text-sm text-muted">{item.subtitle}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
