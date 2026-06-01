"use client";

import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Image } from "@/components/Image";
import { ItemBadges } from "@/components/ItemBadges";
import { type ItemDraft, ItemForm } from "@/components/ItemForm";
import { ItemTitle } from "@/components/ItemTitle";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { fetchPublicItem } from "@/lib/profile-client";
import { formatProgress } from "@/lib/progress";
import { readPageHref } from "@/lib/public-item-types";
import { shareLeisureItem } from "@/lib/share-item";
import { resolveItemSource } from "@/lib/source";
import { getTypeLabel, type LeisureItem, STATUS_CARD_CLASS } from "@/lib/types";

export function PublicItemDetailView() {
  const params = useParams();
  const pathname = usePathname();
  const router = useAppRouter();
  const username = params.username as string;
  const itemId = params.id as string;
  const { status } = useSession();
  const { items, addItem, updateItem, removeItem, setStatus, ready } = useLeisureItems();

  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPublicItem>>>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void fetchPublicItem(username, itemId)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, itemId]);

  const profile = data?.profile;
  const item = data?.item;
  const isOwn = profile?.isOwn ?? false;
  const ownItem = isOwn ? items.find((i) => i.id === itemId) : undefined;

  useEffect(() => {
    if (!item || isOwn) return;
    const exists = items.some(
      (i) => i.type === item.type && i.title === item.title && i.watchUrl === item.watchUrl,
    );
    setAdded(exists);
  }, [item, items, isOwn]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile?.username || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Item not found or profile is private.</p>
        <Link href="/discover" className="mt-4 inline-block font-medium">
          Discover people
        </Link>
      </div>
    );
  }

  const displayItem: LeisureItem = ownItem ?? {
    ...item,
    id: item.id,
    createdAt: item.createdAt,
  };

  const progressLabel = formatProgress(displayItem);
  const profileHref = `/u/${profile.username}`;
  const canReadInApp = item.type === "article" && Boolean(item.watchUrl);
  const readHref = item.watchUrl ? readPageHref(item.watchUrl, pathname) : null;
  const sourceLabel = resolveItemSource({ watchUrl: item.watchUrl, rating: item.rating });

  const handleShare = async () => {
    const result = await shareLeisureItem(displayItem, { username: profile.username ?? undefined });
    if (result === "copied") {
      setShareMessage("Link copied — share the leisure!");
      setTimeout(() => setShareMessage(""), 3000);
    }
  };

  const handleAdd = () => {
    if (added || isOwn) return;
    addItem({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      originalTitle: item.originalTitle,
      imageUrl: item.imageUrl,
      watchUrl: item.watchUrl,
      notes: item.notes,
      status: "queue",
      year: item.year,
      rating: item.rating,
      progress: item.progress,
    });
    setAdded(true);
  };

  const handleRemove = () => {
    if (!ownItem || !confirm(`Remove "${ownItem.title}"?`)) return;
    removeItem(ownItem.id);
    router.push(profileHref);
  };

  const handleSave = (draft: ItemDraft) => {
    updateItem(itemId, draft);
    setEditing(false);
    void fetchPublicItem(username, itemId, true).then(setData);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href={profileHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {profile.name ?? profile.username}&apos;s list
        </Link>

        <article
          data-status={item.status}
          className={`overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 ${STATUS_CARD_CLASS[item.status]}`}
        >
          <div className="relative aspect-[16/9] w-full bg-muted/20 sm:aspect-[21/9]">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                unoptimized
              />
            ) : (
              <TypeAvatar
                type={item.type}
                className="h-full w-full rounded-none"
                iconClassName="h-16 w-16"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <ItemBadges type={item.type} watchUrl={item.watchUrl} rating={item.rating} />
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                <ItemTitle
                  title={item.title}
                  originalTitle={item.originalTitle}
                  originalClassName="text-sm font-normal text-white/75"
                />
              </h1>
              {item.subtitle && <p className="mt-1 text-white/80">{item.subtitle}</p>}
            </div>
            {item.rating && (
              <div className="absolute right-4 top-4">
                <RatingBadge rating={item.rating} />
              </div>
            )}
          </div>

          <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-lg bg-muted/40 px-2.5 py-1 font-medium text-foreground">
                {getTypeLabel(item.type)}
              </span>
              {item.year && (
                <span className="rounded-lg bg-muted/40 px-2.5 py-1 text-muted">{item.year}</span>
              )}
              {sourceLabel && <SourceBadge source={sourceLabel} />}
              {progressLabel && (
                <span className="rounded-lg bg-accent/10 px-2.5 py-1 font-medium text-accent">
                  {progressLabel}
                </span>
              )}
            </div>

            {item.notes && (
              <div className="rounded-2xl border border-border/60 bg-muted/5 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Notes
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.notes}</p>
              </div>
            )}

            {isOwn && ready && (
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Status</p>
                <StatusPicker
                  value={displayItem.status}
                  onChange={(next) => setStatus(itemId, next)}
                  variant="detail"
                  fullWidth
                />
              </section>
            )}

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Actions</p>
              {shareMessage && <p className="text-sm font-medium text-accent">{shareMessage}</p>}
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                {canReadInApp && readHref && (
                  <Link
                    href={readHref}
                    className="flex w-full items-center justify-center gap-2 border-b border-border bg-accent px-4 py-3.5 text-sm font-semibold text-accent-foreground no-underline transition hover:brightness-110"
                  >
                    <BookOpen className="h-4 w-4" />
                    Read in app
                  </Link>
                )}
                {item.watchUrl && !canReadInApp && (
                  <Link
                    href={item.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 border-b border-border bg-accent px-4 py-3.5 text-sm font-semibold text-accent-foreground no-underline transition hover:brightness-110"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {sourceLabel ? `View on ${sourceLabel}` : "Open link"}
                  </Link>
                )}
                <div
                  className={`grid divide-x divide-border ${isOwn ? "grid-cols-3" : "grid-cols-2"}`}
                >
                  {!isOwn && (
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={added || status !== "authenticated"}
                      className="flex flex-col items-center gap-1.5 px-3 py-3.5 text-sm font-medium text-foreground transition hover:bg-muted/30 disabled:opacity-50 sm:flex-row sm:justify-center"
                    >
                      <Plus className="h-4 w-4 text-muted" />
                      {added ? "Added" : "Add to list"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1.5 px-3 py-3.5 text-sm font-medium text-foreground transition hover:bg-muted/30 sm:flex-row sm:justify-center"
                  >
                    <Share2 className="h-4 w-4 text-muted" />
                    Share
                  </button>
                  {!!isOwn && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="flex flex-col items-center gap-1.5 px-3 py-3.5 text-sm font-medium text-foreground transition hover:bg-muted/30 sm:flex-row sm:justify-center"
                      >
                        <Pencil className="h-4 w-4 text-muted" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="flex flex-col items-center gap-1.5 px-3 py-3.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10 sm:flex-row sm:justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!isOwn && status !== "authenticated" && (
                <p className="text-xs text-muted">
                  <Link href="/sign-in" className="font-medium">
                    Sign in
                  </Link>{" "}
                  to add this to your list.
                </p>
              )}
            </section>
          </div>
        </article>
      </div>

      {editing && ownItem && (
        <ItemForm
          mode="edit"
          initialItem={ownItem}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
