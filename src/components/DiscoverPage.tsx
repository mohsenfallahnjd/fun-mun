"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Share2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { AppHeader } from "@/components/SiteNav";

interface ProfileResult {
  id: string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
}

export function DiscoverPage() {
  const { status } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = (await res.json()) as { profiles: ProfileResult[] };
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

  const shareProfile = async (username: string) => {
    const url = `${window.location.origin}/u/${username}`;
    if (navigator.share) {
      await navigator.share({ title: `@${username} on Fun Mun`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Discover people</h1>
        <p className="mt-1 text-muted">Search public profiles, follow, and share lists.</p>
      </header>

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

      {status !== "authenticated" && (
        <p className="rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-muted">
          <Link href="/sign-in" className="font-medium">
            Sign in
          </Link>{" "}
          to follow other profiles.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {results.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="min-w-0">
              <Link
                href={`/u/${profile.username}`}
                className="font-semibold no-underline hover:underline"
              >
                {profile.name ?? profile.username}
              </Link>
              <p className="text-sm text-muted">@{profile.username}</p>
              {profile.bio && <p className="mt-1 line-clamp-2 text-sm text-muted">{profile.bio}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => profile.username && shareProfile(profile.username)}
                className="rounded-lg p-2 text-muted hover:bg-muted/60 hover:text-foreground"
                title="Share profile"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <Link
                href={`/u/${profile.username}`}
                className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent no-underline hover:bg-accent/20"
              >
                View
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-center text-sm text-muted">No public profiles found.</p>
      )}
    </div>
  );
}
