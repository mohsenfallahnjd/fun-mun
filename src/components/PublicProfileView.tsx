"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Image } from "@/components/Image";
import { Loader2, Pencil, Share2, UserMinus, UserPlus } from "@/components/icons";
import { Link } from "@/components/Link";
import { ProfileRow } from "@/components/ProfileRow";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import {
  fetchProfilePeople,
  fetchPublicProfile,
  invalidateMeFollowingCache,
  invalidatePublicProfileCache,
} from "@/lib/profile-client";
import type { ProfileSummary } from "@/lib/profile-types";
import { shareUserProfile } from "@/lib/share-profile";
import type { LeisureType } from "@/lib/types";

type ProfileTab = "list" | "followers" | "following";

interface PublicProfile {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  followerCount: number;
  followingCount: number;
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
  const [shareMessage, setShareMessage] = useState("");
  const [tab, setTab] = useState<ProfileTab>("list");
  const [followers, setFollowers] = useState<ProfileSummary[] | null>(null);
  const [followingList, setFollowingList] = useState<ProfileSummary[] | null>(null);
  const [peopleLoading, setPeopleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTab("list");
    setFollowers(null);
    setFollowingList(null);

    void fetchPublicProfile(username)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setProfile(null);
          setItems([]);
          setFollowing(false);
          return;
        }
        setProfile(data.profile);
        setItems(data.items);
        setFollowing(data.following);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const loadPeople = useCallback(
    async (kind: "followers" | "following") => {
      setPeopleLoading(true);
      try {
        const profiles = await fetchProfilePeople(username, kind);
        if (kind === "followers") setFollowers(profiles);
        else setFollowingList(profiles);
      } finally {
        setPeopleLoading(false);
      }
    },
    [username],
  );

  useEffect(() => {
    if (tab === "followers" && followers === null) void loadPeople("followers");
    if (tab === "following" && followingList === null) void loadPeople("following");
  }, [tab, followers, followingList, loadPeople]);

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
        setFollowers(null);
        invalidatePublicProfileCache(username);
        invalidateMeFollowingCache();
        const data = await fetchPublicProfile(username, true);
        if (data) {
          setProfile(data.profile);
          setItems(data.items);
          setFollowing(data.following);
        }
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const share = useCallback(async () => {
    if (!profile?.username) return;
    const result = await shareUserProfile({
      username: profile.username,
      name: profile.name,
      itemCount: profile.itemCount,
    });
    if (result === "copied") {
      setShareMessage("Link copied — spread the leisure!");
      setTimeout(() => setShareMessage(""), 3000);
    }
  }, [profile]);

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

  const displayName = profile.name ?? profile.username ?? username;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const tabClass = (value: ProfileTab) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      tab === value
        ? "bg-accent text-accent-foreground"
        : "text-muted hover:bg-muted/40 hover:text-foreground"
    }`;

  const peopleList = tab === "followers" ? followers : followingList;
  const peopleEmpty = tab === "followers" ? "No followers yet." : "Not following anyone yet.";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <AppHeader />

      <header className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          {profile.imageUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
              <Image
                src={profile.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent ring-2 ring-border">
              {avatarInitial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{profile.name ?? profile.username}</h1>
            <p className="text-muted">@{profile.username}</p>
            {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              <span>{profile.itemCount} items</span>
              <button
                type="button"
                onClick={() => setTab("followers")}
                className="hover:text-foreground"
              >
                <span className="font-semibold text-foreground">{profile.followerCount}</span>{" "}
                followers
              </button>
              <button
                type="button"
                onClick={() => setTab("following")}
                className="hover:text-foreground"
              >
                <span className="font-semibold text-foreground">{profile.followingCount}</span>{" "}
                following
              </button>
            </div>
            {shareMessage && <p className="mt-2 text-sm font-medium text-accent">{shareMessage}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
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

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("list")} className={tabClass("list")}>
          Leisure list
        </button>
        <button type="button" onClick={() => setTab("followers")} className={tabClass("followers")}>
          Followers ({profile.followerCount})
        </button>
        <button type="button" onClick={() => setTab("following")} className={tabClass("following")}>
          Following ({profile.followingCount})
        </button>
      </div>

      {tab === "list" && (
        <section>
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
      )}

      {(tab === "followers" || tab === "following") && (
        <section>
          {peopleLoading || peopleList === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : peopleList.length === 0 ? (
            <p className="text-sm text-muted">{peopleEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {peopleList.map((person) => (
                <ProfileRow key={person.id} profile={person} showActions={false} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
