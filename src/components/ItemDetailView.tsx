"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Image } from "@/components/Image";
import { type ItemDraft, ItemForm } from "@/components/ItemForm";
import { ItemTitle } from "@/components/ItemTitle";
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import { useLeisureItems } from "@/hooks/useLeisureItems";
import { formatProgress } from "@/lib/progress";
import { getTypeLabel, STATUS_CARD_CLASS } from "@/lib/types";

export function ItemDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { items, ready, setStatus, removeItem, updateItem } = useLeisureItems();
  const [editing, setEditing] = useState(false);

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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{getTypeLabel(item.type)}</span>
              {item.year && <span>{item.year}</span>}
              {item.rating && <RatingBadge rating={item.rating} variant="detail" />}
              {progressLabel && (
                <span className="rounded-lg bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  {progressLabel}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Status
              </p>
              <StatusPicker
                value={item.status}
                onChange={(status) => setStatus(item.id, status)}
                fullWidth
              />
            </div>

            {item.notes && (
              <div>
                <p className="mb-2 text-sm font-medium">Notes</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {item.notes}
                </p>
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
                  Open link
                </Link>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
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
