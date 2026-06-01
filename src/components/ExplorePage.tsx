"use client";

import { useEffect, useState } from "react";
import { ExploreSectionLink } from "@/components/ExploreCategoryPage";
import { Image } from "@/components/Image";
import { ItemBadges } from "@/components/ItemBadges";
import { ItemTitle } from "@/components/ItemTitle";
import { Plus } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import type { ExploreLeisureType } from "@/lib/explore-catalog";
import { EXPLORE_CATEGORY_META, exploreItemPath } from "@/lib/explore-catalog";
import { fetchExploreSections } from "@/lib/explore-client";
import type { ExploreItem, ExploreSection } from "@/lib/explore-service";

function ExploreCard({
  type,
  item,
  onAdd,
  added,
}: {
  type: ExploreLeisureType;
  item: ExploreItem;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <div className="flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:w-44">
      <Link
        href={exploreItemPath(type, item.id)}
        className="relative block aspect-[3/4] w-full no-underline"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="176px"
            unoptimized
          />
        ) : (
          <TypeAvatar type={type} className="h-full w-full rounded-none" iconClassName="h-8 w-8" />
        )}
        {item.rating && (
          <div className="absolute bottom-2 right-2">
            <RatingBadge rating={item.rating} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <ItemBadges
          type={type}
          watchUrl={item.watchUrl}
          rating={item.rating}
          fallbackSource={EXPLORE_CATEGORY_META[type].source}
        />
        <Link
          href={exploreItemPath(type, item.id)}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground no-underline hover:text-accent"
        >
          <ItemTitle title={item.title} originalTitle={item.originalTitle} />
        </Link>
        {item.subtitle && <p className="line-clamp-2 text-xs text-muted">{item.subtitle}</p>}
        <div className="flex items-center gap-2">
          {item.year && <p className="text-xs text-muted">{item.year}</p>}
          {item.rating && !item.imageUrl && <RatingBadge rating={item.rating} variant="inline" />}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={added}
          className="mt-auto inline-flex items-center justify-center gap-1 rounded-lg bg-accent/10 px-2 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {added ? "Added" : "Add to list"}
        </button>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden pb-2">
      {["a", "b", "c", "d"].map((id) => (
        <div
          key={id}
          className="h-64 w-40 shrink-0 animate-pulse rounded-2xl bg-muted/40 sm:w-44"
        />
      ))}
    </div>
  );
}

export function ExplorePage() {
  const { items, addItem } = useLeisureItems();
  const [sections, setSections] = useState<ExploreSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();

    fetchExploreSections(controller.signal)
      .then((data) => {
        setSections(data);
        setError(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleAdd = (type: ExploreLeisureType, item: ExploreItem) => {
    const key = `${type}:${item.id}`;
    if (addedKeys.has(key) || items.some((i) => i.type === type && i.title === item.title)) {
      setAddedKeys((s) => new Set(s).add(key));
      return;
    }

    addItem({
      type,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      watchUrl: item.watchUrl,
      status: "queue",
      year: item.year,
      rating: item.rating,
      originalTitle: item.originalTitle,
    });
    setAddedKeys((s) => new Set(s).add(key));
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <AppHeader />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Explore</h1>
        <p className="mt-1 text-muted">
          Live picks from Open Library, TMDB, iTunes, RAWG, and more — refreshed hourly.
        </p>
      </header>

      {loading && (
        <div className="flex flex-col gap-8">
          {["books", "movies", "games"].map((id) => (
            <div key={id}>
              <div className="mb-3 h-6 w-40 animate-pulse rounded-lg bg-muted/40" />
              <SectionSkeleton />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Could not load explore feed. Try again later.
        </p>
      )}

      {!loading &&
        sections.map((section) => (
          <section key={section.type}>
            <div className="mb-3">
              <ExploreSectionLink type={section.type} title={section.title} />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {section.items.map((item) => {
                const key = `${section.type}:${item.id}`;
                const already =
                  addedKeys.has(key) ||
                  items.some((i) => i.type === section.type && i.title === item.title);
                return (
                  <ExploreCard
                    key={key}
                    type={section.type}
                    item={item}
                    added={already}
                    onAdd={() => handleAdd(section.type, item)}
                  />
                );
              })}
            </div>
          </section>
        ))}

      {!loading && !error && sections.length === 0 && (
        <p className="text-center text-muted">Nothing to explore right now. Check back soon.</p>
      )}
    </div>
  );
}
