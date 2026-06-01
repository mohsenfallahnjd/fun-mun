"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "@/components/Image";
import { ItemTitle } from "@/components/ItemTitle";
import { ArrowLeft, ChevronRight, Loader2, Search, X } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import type { ExploreLeisureType } from "@/lib/explore-catalog";
import {
  EXPLORE_CATEGORY_META,
  exploreCategoryPath,
  exploreItemPath,
  parseExploreType,
} from "@/lib/explore-catalog";
import { fetchExploreCategoryPage, fetchExploreCategorySearch } from "@/lib/explore-client";
import type { ExploreItem } from "@/lib/explore-service";

function GridCard({ type, item }: { type: ExploreLeisureType; item: ExploreItem }) {
  return (
    <Link
      href={exploreItemPath(type, item.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface no-underline shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full bg-muted/20">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, 200px"
            unoptimized
          />
        ) : (
          <TypeAvatar
            type={type}
            className="h-full w-full rounded-none"
            iconClassName="h-10 w-10"
          />
        )}
        {item.rating && (
          <div className="absolute bottom-2 right-2">
            <RatingBadge rating={item.rating} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <ItemTitle
          title={item.title}
          originalTitle={item.originalTitle}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
        />
        {item.subtitle && <p className="line-clamp-2 text-xs text-muted">{item.subtitle}</p>}
        <div className="flex items-center gap-2">
          {item.year && <p className="text-xs text-muted">{item.year}</p>}
          {item.rating && !item.imageUrl && <RatingBadge rating={item.rating} variant="inline" />}
        </div>
      </div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => (
        <div key={id} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/40" />
      ))}
    </div>
  );
}

const SEARCH_PLACEHOLDER: Record<ExploreLeisureType, string> = {
  book: "Search books by title or author…",
  audiobook: "Search audiobooks…",
  podcast: "Search podcasts…",
  movie: "Search movies…",
  series: "Search TV series…",
  game: "Search games…",
  place: "Search places and destinations…",
};

export function ExploreCategoryPage() {
  const params = useParams();
  const typeParam = params.type as string;
  const type = parseExploreType(typeParam);

  const [items, setItems] = useState<ExploreItem[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const loadGenRef = useRef(0);
  const fetchedPagesRef = useRef(new Set<string>());

  const isSearching = debouncedQuery.length >= 2;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!type) return;

      const pageKey = isSearching ? `${debouncedQuery}:${pageNum}` : String(pageNum);
      if (fetchedPagesRef.current.has(pageKey)) return;

      const gen = ++loadGenRef.current;
      fetchedPagesRef.current.add(pageKey);

      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const data = isSearching
          ? await fetchExploreCategorySearch(type, debouncedQuery, pageNum)
          : await fetchExploreCategoryPage(type, pageNum);
        if (gen !== loadGenRef.current) return;
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasMore);
        setPage(pageNum);
        setError(false);
      } catch {
        fetchedPagesRef.current.delete(pageKey);
        if (gen !== loadGenRef.current) return;
        setError(true);
        if (!append) setItems([]);
        setHasMore(false);
      } finally {
        if (gen === loadGenRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [type, debouncedQuery, isSearching],
  );

  useEffect(() => {
    if (!type) return;
    loadGenRef.current += 1;
    fetchedPagesRef.current.clear();
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, false);
  }, [type, loadPage]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || items.length === 0 || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMoreRef.current && !loading) {
          loadingMoreRef.current = true;
          loadPage(page + 1, true).finally(() => {
            loadingMoreRef.current = false;
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, items.length, page, loadPage]);

  if (!type) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted">Category not found.</p>
        <Link href="/explore" className="mt-4 inline-block font-medium">
          Back to explore
        </Link>
      </div>
    );
  }

  const meta = EXPLORE_CATEGORY_META[type];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Explore
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TypeBadge type={type} />
              <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
            </div>
            <p className="mt-1 text-muted">{meta.description}</p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER[type]}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm outline-none ring-accent/30 focus:ring-2"
        />
        {(loading && query.length >= 2) || (query !== debouncedQuery && query.length >= 2) ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:bg-muted/50 hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isSearching && !loading && !error && (
        <p className="text-sm text-muted">
          {items.length > 0
            ? `Results for “${debouncedQuery}”`
            : `No results for “${debouncedQuery}”`}
        </p>
      )}

      {loading && <GridSkeleton />}

      {error && !loading && items.length === 0 && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Could not load {meta.title.toLowerCase()}. Try again later.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <GridCard key={`${type}:${item.id}`} type={type} item={item} />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && !isSearching && (
        <p className="text-center text-muted">Nothing here yet. Check back soon.</p>
      )}

      <div ref={sentinelRef} className="flex h-12 items-center justify-center">
        {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted" />}
        {!hasMore && items.length > 0 && (
          <p className="text-sm text-muted">You&apos;ve reached the end</p>
        )}
      </div>
    </div>
  );
}

export function ExploreSectionLink({ type, title }: { type: ExploreLeisureType; title: string }) {
  return (
    <Link
      href={exploreCategoryPath(type)}
      className="group inline-flex items-center gap-1 text-lg font-semibold text-foreground no-underline hover:text-accent"
    >
      {title}
      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
