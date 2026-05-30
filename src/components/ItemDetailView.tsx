"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Image } from "@/components/Image";
import { type ItemDraft, ItemForm } from "@/components/ItemForm";
import { ItemTitle } from "@/components/ItemTitle";
import { ArrowLeft, ExternalLink, Pencil, Share2, Trash2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { formatProgress } from "@/lib/progress";
import { shareLeisureItem } from "@/lib/share-item";
import { getTypeLabel, STATUS_CARD_CLASS } from "@/lib/types";

export function ItemDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { items, ready, setStatus, removeItem, updateItem } = useLeisureItems();
  const [editing, setEditing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const item = items.find((i) => i.id === id);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Item not found.</p>
        <Link href="/" className="mt-4 inline-block font-medium">
          Back to list
        </Link>
      </div>
    );
  }

  const progressLabel = formatProgress(item);

  const handleRemove = () => {
    if (confirm(`Remove "${item.title}"?`)) {
      removeItem(item.id);
      router.push("/");
    }
  };

  const handleSave = (draft: ItemDraft) => {
    updateItem(item.id, draft);
    setEditing(false);
  };

  const handleShare = async () => {
    const result = await shareLeisureItem(item);
    if (result === "copied") {
      setShareMessage("Link copied — share the leisure!");
      setTimeout(() => setShareMessage(""), 3000);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
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
                priority
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
              <TypeBadge type={item.type} />
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
            {(item.year || progressLabel) && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-lg bg-muted/40 px-2.5 py-1 font-medium text-foreground">
                  {getTypeLabel(item.type)}
                </span>
                {item.year && (
                  <span className="rounded-lg bg-muted/40 px-2.5 py-1 text-muted">{item.year}</span>
                )}
                {progressLabel && (
                  <span className="rounded-lg bg-accent/10 px-2.5 py-1 font-medium text-accent">
                    {progressLabel}
                  </span>
                )}
              </div>
            )}

            {item.notes && (
              <div className="rounded-2xl border border-border/60 bg-muted/5 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Notes
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.notes}</p>
              </div>
            )}

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Status</p>
              <StatusPicker
                value={item.status}
                onChange={(status) => setStatus(item.id, status)}
                variant="detail"
                fullWidth
              />
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Actions</p>
              {shareMessage && <p className="text-sm font-medium text-accent">{shareMessage}</p>}
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                {item.watchUrl && (
                  <Link
                    href={item.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 border-b border-border bg-accent px-4 py-3.5 text-sm font-semibold text-accent-foreground no-underline transition hover:brightness-110"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open link
                  </Link>
                )}
                <div className="grid grid-cols-3 divide-x divide-border">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1.5 px-3 py-3.5 text-sm font-medium text-foreground transition hover:bg-muted/30 sm:flex-row sm:justify-center"
                  >
                    <Share2 className="h-4 w-4 text-muted" />
                    Share
                  </button>
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
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>

      {editing && (
        <ItemForm
          mode="edit"
          initialItem={item}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
