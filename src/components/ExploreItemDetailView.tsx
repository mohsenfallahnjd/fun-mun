"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Image } from "@/components/Image";
import { ItemTitle } from "@/components/ItemTitle";
import { ArrowLeft, ExternalLink, Loader2, Plus } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { AppHeader } from "@/components/SiteNav";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import {
  EXPLORE_CATEGORY_META,
  exploreCategoryPath,
  parseExploreType,
} from "@/lib/explore-catalog";
import { fetchExploreItemDetail } from "@/lib/explore-client";
import type { ExploreItemDetail } from "@/lib/explore-service";
import { getTypeLabel } from "@/lib/types";

export function ExploreItemDetailView() {
  const params = useParams();
  const typeParam = params.type as string;
  const id = params.id as string;
  const type = parseExploreType(typeParam);

  const { items, addItem } = useLeisureItems();
  const [item, setItem] = useState<ExploreItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!type) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchExploreItemDetail(type, id, controller.signal)
      .then((detail) => {
        setItem(detail);
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
  }, [type, id]);

  useEffect(() => {
    if (!type || !item) return;
    const exists = items.some((i) => i.type === type && i.title === item.title);
    setAdded(exists);
  }, [type, item, items]);

  const handleAdd = () => {
    if (!type || !item || added) return;

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
    setAdded(true);
  };

  if (!type) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Category not found.</p>
        <Link href="/explore" className="mt-4 inline-block font-medium">
          Back to explore
        </Link>
      </div>
    );
  }

  const meta = EXPLORE_CATEGORY_META[type];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Could not load this item.</p>
        <Link href={exploreCategoryPath(type)} className="mt-4 inline-block font-medium">
          Back to {meta.title.toLowerCase()}
        </Link>
      </div>
    );
  }

  const sourceLabel = item.sourceName ?? meta.source;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <AppHeader />
      <Link
        href={exploreCategoryPath(type)}
        className="mb-6 mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {meta.title}
      </Link>

      <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="relative aspect-[16/9] w-full bg-muted/20 sm:aspect-[21/9]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized
              priority
            />
          ) : (
            <TypeAvatar
              type={type}
              className="h-full w-full rounded-none"
              iconClassName="h-16 w-16"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <TypeBadge type={type} />
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              <ItemTitle
                title={item.title}
                originalTitle={item.originalTitle}
                originalClassName="text-sm font-normal text-white/75"
              />
            </h1>
            {item.subtitle && !item.originalTitle && (
              <p className="mt-1 text-white/80">{item.subtitle}</p>
            )}
            {item.subtitle && item.originalTitle && item.subtitle !== item.originalTitle && (
              <p className="mt-1 text-white/80">{item.subtitle}</p>
            )}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{getTypeLabel(type)}</span>
            {item.year && <span>{item.year}</span>}
            {item.rating && <RatingBadge rating={item.rating} variant="detail" />}
            <span>via {sourceLabel}</span>
          </div>

          {item.description && (
            <div>
              <p className="mb-2 text-sm font-medium">About</p>
              <p className="text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {item.watchUrl && (
              <Link
                href={item.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground no-underline hover:brightness-110"
              >
                <ExternalLink className="h-4 w-4" />
                View on {sourceLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={added}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {added ? "In your list" : "Add to my list"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
