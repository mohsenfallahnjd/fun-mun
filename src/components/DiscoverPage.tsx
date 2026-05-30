"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, User } from "@/components/icons";
import { Link } from "@/components/Link";
import { ProfileRow } from "@/components/ProfileRow";
import { AppHeader } from "@/components/SiteNav";
import { fetchMeFollowing } from "@/lib/profile-client";
import type { ProfileSummary } from "@/lib/profile-types";
import { shareUserProfile } from "@/lib/share-profile";

export function DiscoverPage() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSummary[]>([]);
  const [following, setFollowing] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const loadFollowing = useCallback(async () => {
    if (!isSignedIn) {
      setFollowing([]);
      return;
    }

    setFollowingLoading(true);
    try {
      setFollowing(await fetchMeFollowing());
    } finally {
      setFollowingLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (status === "loading") return;
    void loadFollowing();
  }, [status, loadFollowing]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = (await res.json()) as { profiles: ProfileSummary[] };
        setResults(data.profiles);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  const shareProfile = async (profile: ProfileSummary) => {
    if (!profile.username) return;
    const result = await shareUserProfile({
      username: profile.username,
      name: profile.name,
    });
    if (result === "copied") {
      alert("Link copied — spread the leisure!");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Discover people</h1>
        <p className="mt-1 text-muted">Search public profiles, follow, and share lists.</p>
      </header>

      {isSignedIn && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <User className="h-4 w-4" />
            People you follow
          </h2>
          {followingLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : following.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {following.map((profile) => (
                <ProfileRow key={profile.id} profile={profile} />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              You are not following anyone yet. Search below and tap Follow on a profile.
            </p>
          )}
        </section>
      )}

      {!isSignedIn && status !== "loading" && (
        <p className="rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-muted">
          <Link href="/sign-in" className="font-medium">
            Sign in
          </Link>{" "}
          to follow other profiles and see them here.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Search</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm outline-none ring-accent/30 focus:ring-2"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
      </section>

      {query.length >= 2 && (
        <ul className="flex flex-col gap-3">
          {results.map((profile) => (
            <ProfileRow key={profile.id} profile={profile} onShare={shareProfile} />
          ))}
        </ul>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-center text-sm text-muted">No public profiles found.</p>
      )}
    </div>
  );
}
