"use client";

import { Image } from "@/components/Image";
import { ItemTitle } from "@/components/ItemTitle";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
import { formatProgress } from "@/lib/progress";
import { type LeisureItem, type LeisureStatus, STATUS_CARD_CLASS } from "@/lib/types";

interface LeisureCardProps {
  item: LeisureItem;
  draggable?: boolean;
  isDragOver?: boolean;
  onStatusChange: (id: string, status: LeisureStatus) => void;
  onEdit: (item: LeisureItem) => void;
  onRemove: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
  onDragEnd?: () => void;
}

export function LeisureCard({
  item,
  draggable = false,
  isDragOver = false,
  onStatusChange,
  onEdit,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LeisureCardProps) {
  const progressLabel = formatProgress(item);
  const statusStyle = STATUS_CARD_CLASS[item.status];

  return (
    <article
      draggable={draggable}
      data-status={item.status}
      onDragStart={() => onDragStart?.(item.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(item.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(item.id);
      }}
      onDragEnd={onDragEnd}
      className={`group flex gap-3 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${statusStyle} ${
        isDragOver ? "border-accent ring-2 ring-accent/30" : ""
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {draggable && (
        <div className="flex shrink-0 items-center text-muted">
          <GripVertical className="h-5 w-5" aria-hidden />
        </div>
      )}

      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        ) : (
          <TypeAvatar type={item.type} />
        )}
        {item.rating && (
          <div className="absolute bottom-1 right-1">
            <RatingBadge rating={item.rating} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={`truncate text-base font-semibold leading-snug ${item.status === "done" ? "line-through" : ""}`}
            >
              <Link href={`/items/${item.id}`} className="no-underline hover:text-accent">
                <ItemTitle title={item.title} originalTitle={item.originalTitle} />
              </Link>
            </h3>
            {item.subtitle && <p className="truncate text-sm text-muted">{item.subtitle}</p>}
          </div>
          <TypeBadge type={item.type} />
        </div>

        {progressLabel && (
          <p className="inline-flex w-fit rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {progressLabel}
          </p>
        )}

        {item.notes && <p className="line-clamp-2 text-sm text-muted">{item.notes}</p>}

        <StatusPicker
          value={item.status}
          onChange={(status) => onStatusChange(item.id, status)}
          size="sm"
          fullWidth
        />

        <div className="flex flex-wrap items-center gap-2">
          {item.watchUrl && (
            <Link
              href={item.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium no-underline hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open link
            </Link>
          )}

          {item.year && <span className="text-xs text-muted">{item.year}</span>}
          {item.rating && <RatingBadge rating={item.rating} variant="inline" />}

          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg p-1.5 text-muted transition-all hover:bg-muted/60 hover:text-foreground"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-lg p-1.5 text-muted transition-all hover:bg-red-500/10 hover:text-red-500"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
