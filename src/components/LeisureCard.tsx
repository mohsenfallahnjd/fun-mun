"use client";

import { useRef } from "react";
import { Image } from "@/components/Image";
import { ItemBadges } from "@/components/ItemBadges";
import { ItemTitle } from "@/components/ItemTitle";
import {
  BellRing,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Pencil,
  Share2,
  Trash2,
} from "@/components/icons";
import { Link } from "@/components/Link";
import { RatingBadge } from "@/components/RatingBadge";
import { RELEASE_DAY_NAMES } from "@/components/ReleaseReminderButton";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { useProfileUsername } from "@/hooks/useProfileUsername";
import {
  advanceProgress,
  canAdvanceProgress,
  formatProgress,
  nextProgressLabel,
} from "@/lib/progress";
import { readPageHref } from "@/lib/public-item-types";
import { shareLeisureItem } from "@/lib/share-item";
import { resolveItemSource } from "@/lib/source";
import { type LeisureItem, type LeisureStatus, STATUS_CARD_CLASS } from "@/lib/types";

interface LeisureCardProps {
  item: LeisureItem;
  draggable?: boolean;
  isDragOver?: boolean;
  onStatusChange: (id: string, status: LeisureStatus) => void;
  onProgressAdvance: (id: string, progress: NonNullable<LeisureItem["progress"]>) => void;
  onEdit: (item: LeisureItem) => void;
  onRemove: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (overId: string, activeId?: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function LeisureCard({
  item,
  draggable = false,
  isDragOver = false,
  onStatusChange,
  onProgressAdvance,
  onEdit,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}: LeisureCardProps) {
  const username = useProfileUsername();
  const articleRef = useRef<HTMLElement>(null);
  const progressLabel = formatProgress(item);
  const statusStyle = STATUS_CARD_CLASS[item.status];
  const showNext = canAdvanceProgress(item);
  const canRead = item.type === "article" && Boolean(item.watchUrl);
  const sourceLabel = resolveItemSource({ watchUrl: item.watchUrl, rating: item.rating });

  const handleShare = () => {
    void shareLeisureItem(item, username ? { username } : undefined);
  };

  const handleNext = () => {
    const next = advanceProgress(item);
    if (next) onProgressAdvance(item.id, next);
  };

  const handleGripTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!draggable) return;
    e.stopPropagation();
    onDragStart?.(item.id);

    const activeId = item.id;
    let lastOverId = item.id;

    const onTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const touch = moveEvent.touches[0];
      if (!touch) return;

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = el?.closest<HTMLElement>("[data-reorder-id]");
      const overId = card?.dataset.reorderId;
      if (overId) {
        lastOverId = overId;
        onDragOver?.(overId);
      }
    };

    const onTouchEnd = () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      onDrop?.(lastOverId, activeId);
      onDragEnd?.();
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
  };

  return (
    <article
      ref={articleRef}
      data-reorder-id={item.id}
      data-status={item.status}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(item.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(item.id);
      }}
      className={`group flex gap-3 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${statusStyle} ${
        isDragOver ? "border-accent ring-2 ring-accent/30" : ""
      } ${isDragging ? "scale-[0.98] opacity-60" : ""}`}
    >
      {draggable && (
        <button
          type="button"
          aria-label="Drag to reorder"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = "move";
            if (articleRef.current) {
              e.dataTransfer.setDragImage(articleRef.current, 32, 32);
            }
            onDragStart?.(item.id);
          }}
          onDragEnd={onDragEnd}
          onTouchStart={handleGripTouchStart}
          className="-ml-1 flex shrink-0 touch-none select-none items-center self-stretch rounded-lg px-1.5 text-muted active:bg-muted/50"
        >
          <GripVertical className="h-5 w-5" aria-hidden />
        </button>
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
          <ItemBadges type={item.type} watchUrl={item.watchUrl} rating={item.rating} />
        </div>

        {progressLabel && (
          <p className="inline-flex w-fit rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {progressLabel}
          </p>
        )}

        {item.releaseReminderEnabled && (item.releaseDate || item.releaseDay !== undefined) && (
          <p className="inline-flex w-fit items-center gap-1 rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            <BellRing className="h-3 w-3" />
            {item.releaseDay !== undefined
              ? `Every ${RELEASE_DAY_NAMES[item.releaseDay]}`
              : item.releaseDate
                ? new Date(`${item.releaseDate}T00:00:00`).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : null}
          </p>
        )}

        {item.notes && (
          <p className="hidden line-clamp-2 text-sm text-muted sm:block">{item.notes}</p>
        )}

        <StatusPicker
          value={item.status}
          onChange={(status) => onStatusChange(item.id, status)}
          size="sm"
          fullWidth
        />

        <div className="flex items-center gap-2">
          {showNext && (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground transition hover:brightness-110"
            >
              {nextProgressLabel(item)}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {canRead && item.watchUrl && (
            <Link
              href={readPageHref(item.watchUrl, `/items/${item.id}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium no-underline hover:bg-muted"
            >
              Read
            </Link>
          )}

          {item.watchUrl && !canRead && (
            <Link
              href={item.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium no-underline hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{sourceLabel ?? "Open"}</span>
              <span className="sm:hidden">Open</span>
            </Link>
          )}

          {item.year && <span className="hidden text-xs text-muted sm:inline">{item.year}</span>}

          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="hidden rounded-lg p-1.5 text-muted transition-all hover:bg-muted/60 hover:text-foreground sm:block"
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
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
