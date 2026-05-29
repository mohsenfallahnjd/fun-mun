"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "@/components/Image";
import { ItemTitle } from "@/components/ItemTitle";
import { Loader2, Plus, Search, X } from "@/components/icons";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { RatingBadge } from "@/components/RatingBadge";
import { StatusPicker } from "@/components/StatusPicker";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge, TypeIcon } from "@/components/TypeBadge";
import type { LinkPreviewData } from "@/lib/link-preview";
import { isValidHttpUrl } from "@/lib/link-preview";
import { parseOptionalFloat, parseOptionalInt, progressFieldsForType } from "@/lib/progress";
import type { ContentRating } from "@/lib/rating";
import type {
  LeisureItem,
  LeisureProgress,
  LeisureStatus,
  LeisureType,
  SearchResponse,
  SearchResult,
  TypedSearchResult,
} from "@/lib/types";
import { getTypeLabel, LEISURE_TYPES } from "@/lib/types";

export interface ItemDraft {
  type: LeisureType;
  title: string;
  subtitle?: string;
  originalTitle?: string;
  imageUrl?: string;
  watchUrl?: string;
  notes?: string;
  year?: number;
  rating?: ContentRating;
  status: LeisureStatus;
  progress?: LeisureProgress;
}

interface ItemFormProps {
  mode: "add" | "edit";
  initialItem?: LeisureItem;
  onSave: (draft: ItemDraft) => void;
  onClose: () => void;
}

function searchEndpoint(type: LeisureType): string | null {
  if (type === "book" || type === "audiobook") return "/api/search/books";
  if (type === "movie" || type === "series") return "/api/search/media";
  if (type === "game") return "/api/search/games";
  return null;
}

function progressToStrings(progress?: LeisureProgress) {
  return {
    page: progress?.page?.toString() ?? "",
    totalPages: progress?.totalPages?.toString() ?? "",
    watchedMinutes: progress?.watchedMinutes?.toString() ?? "",
    totalMinutes: progress?.totalMinutes?.toString() ?? "",
    season: progress?.season?.toString() ?? "",
    episode: progress?.episode?.toString() ?? "",
    hoursPlayed: progress?.hoursPlayed?.toString() ?? "",
  };
}

export function ItemForm({ mode, initialItem, onSave, onClose }: ItemFormProps) {
  const [type, setType] = useState<LeisureType | null>(initialItem?.type ?? null);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [query, setQuery] = useState(initialItem?.title ?? "");
  const [originalTitle, setOriginalTitle] = useState(initialItem?.originalTitle ?? "");
  const [subtitle, setSubtitle] = useState(initialItem?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(initialItem?.imageUrl ?? "");
  const [watchUrl, setWatchUrl] = useState(initialItem?.watchUrl ?? "");
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [year, setYear] = useState(initialItem?.year?.toString() ?? "");
  const [rating, setRating] = useState<ContentRating | undefined>(initialItem?.rating);
  const [status, setStatus] = useState<LeisureStatus>(initialItem?.status ?? "queue");

  const initialProgress = progressToStrings(initialItem?.progress);
  const [page, setPage] = useState(initialProgress.page);
  const [totalPages, setTotalPages] = useState(initialProgress.totalPages);
  const [watchedMinutes, setWatchedMinutes] = useState(initialProgress.watchedMinutes);
  const [totalMinutes, setTotalMinutes] = useState(initialProgress.totalMinutes);
  const [season, setSeason] = useState(initialProgress.season);
  const [episode, setEpisode] = useState(initialProgress.episode);
  const [hoursPlayed, setHoursPlayed] = useState(initialProgress.hoursPlayed);

  const [results, setResults] = useState<(SearchResult | TypedSearchResult)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | TypedSearchResult | null>(null);

  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const linkDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const endpoint = type ? searchEndpoint(type) : null;
  const canSearch = globalSearch || endpoint !== null;
  const progressFields = type ? progressFieldsForType(type) : null;
  const needsCategory = mode === "add" && !type && !globalSearch;

  const search = useCallback(
    async (q: string) => {
      if (!canSearch || q.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        if (globalSearch) {
          const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as { results: TypedSearchResult[] };
          setResults(data.results ?? []);
        } else if (endpoint && type) {
          const params = new URLSearchParams({ q });
          if (type === "series") params.set("type", "series");
          else if (type === "movie") params.set("type", "movie");

          const res = await fetch(`${endpoint}?${params}`);
          const data = (await res.json()) as SearchResponse | SearchResult[];

          if (Array.isArray(data)) {
            setResults(data);
          } else {
            setResults(data.results);
          }
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [canSearch, endpoint, globalSearch, type],
  );

  const fetchLinkPreview = useCallback(
    async (url: string) => {
      if (!isValidHttpUrl(url)) {
        setLinkPreview(null);
        return;
      }

      setLinkLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          setLinkPreview(null);
          return;
        }
        const data = (await res.json()) as LinkPreviewData;
        setLinkPreview(data);

        if (!query.trim() && data.title) setQuery(data.title);
        if (!subtitle.trim() && data.description) setSubtitle(data.description.slice(0, 120));
        if (!imageUrl && data.imageUrl) setImageUrl(data.imageUrl);
      } catch {
        setLinkPreview(null);
      } finally {
        setLinkLoading(false);
      }
    },
    [query, subtitle, imageUrl],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!canSearch || selected) return;

    debounceRef.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, canSearch, selected]);

  useEffect(() => {
    if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current);
    const trimmed = watchUrl.trim();
    if (!trimmed) {
      setLinkPreview(null);
      return;
    }

    linkDebounceRef.current = setTimeout(() => fetchLinkPreview(trimmed), 600);
    return () => {
      if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current);
    };
  }, [watchUrl, fetchLinkPreview]);

  const changeType = (next: LeisureType) => {
    setType(next);
    setGlobalSearch(false);
    if (mode === "add") {
      setQuery("");
      setResults([]);
      setSelected(null);
    }
  };

  const enableGlobalSearch = () => {
    setGlobalSearch(true);
    setType(null);
    setResults([]);
    setSelected(null);
  };

  const pickResult = (result: SearchResult | TypedSearchResult) => {
    setSelected(result);
    setQuery(result.title);
    setOriginalTitle(result.originalTitle ?? "");
    if ("type" in result && result.type) setType(result.type);
    if (result.subtitle) setSubtitle(result.subtitle);
    if (result.imageUrl) setImageUrl(result.imageUrl);
    if (result.year) setYear(result.year.toString());
    if (result.rating) setRating(result.rating);
    if (result.sourceUrl) {
      setWatchUrl(result.sourceUrl);
      setLinkPreview(null);
    }
    setResults([]);
    setGlobalSearch(false);
  };

  const applyPreview = () => {
    if (!linkPreview) return;
    if (linkPreview.title) setQuery(linkPreview.title);
    if (linkPreview.description) setSubtitle(linkPreview.description.slice(0, 120));
    if (linkPreview.imageUrl) setImageUrl(linkPreview.imageUrl);
  };

  const buildProgress = (): LeisureProgress | undefined => {
    if (!progressFields) return undefined;
    const p: LeisureProgress = {};
    if (progressFields.pages) {
      p.page = parseOptionalInt(page);
      p.totalPages = parseOptionalInt(totalPages);
    }
    if (progressFields.time) {
      p.watchedMinutes = parseOptionalInt(watchedMinutes);
      p.totalMinutes = parseOptionalInt(totalMinutes);
    }
    if (progressFields.episode) {
      p.season = parseOptionalInt(season);
      p.episode = parseOptionalInt(episode);
    }
    if (progressFields.hours) {
      p.hoursPlayed = parseOptionalFloat(hoursPlayed);
    }
    const hasValue = Object.values(p).some((v) => v != null);
    return hasValue ? p : undefined;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = query.trim();
    if (!title || !type) return;

    onSave({
      type,
      title,
      subtitle: subtitle.trim() || undefined,
      originalTitle: originalTitle.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      watchUrl: watchUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      year: parseOptionalInt(year),
      rating,
      status,
      progress: buildProgress(),
    });
    onClose();
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2";

  const resultType = (result: SearchResult | TypedSearchResult): LeisureType =>
    "type" in result && result.type ? result.type : (type ?? "book");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={submit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "add" ? "Add to leisure list" : "Edit item"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-muted/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-2 text-sm font-medium">What are you adding?</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {LEISURE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => changeType(t.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  type === t.value && !globalSearch
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted/60 text-muted hover:text-foreground"
                }`}
              >
                <TypeIcon type={t.value} className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={enableGlobalSearch}
            className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              globalSearch
                ? "bg-accent text-accent-foreground"
                : "border border-dashed border-border text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Search all categories
          </button>

          {needsCategory && (
            <p className="mb-4 rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted">
              Pick a category above, or use global search to find anything.
            </p>
          )}

          <label htmlFor="item-link" className="mb-1 block text-sm font-medium">
            Link (optional)
          </label>
          <input
            id="item-link"
            value={watchUrl}
            onChange={(e) => setWatchUrl(e.target.value)}
            placeholder="Paste a URL to preview and auto-fill…"
            className={inputClass}
          />
          <LinkPreviewCard
            preview={linkPreview}
            loading={linkLoading}
            onApply={applyPreview}
            onDismiss={() => setLinkPreview(null)}
          />

          <label htmlFor="item-title" className="mb-1 mt-4 block text-sm font-medium">
            {canSearch ? "Search or type a name" : "Name"}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="item-title"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selected) setSelected(null);
              }}
              disabled={needsCategory}
              placeholder={
                needsCategory
                  ? "Choose a category first…"
                  : canSearch
                    ? "Start typing to auto-fill…"
                    : "Enter a name"
              }
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
            )}
          </div>

          {results.length > 0 && !selected && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-background">
              {results.map((result) => (
                <li key={`${resultType(result)}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => pickResult(result)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                  >
                    {result.imageUrl ? (
                      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded">
                        <Image
                          src={result.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <TypeAvatar
                        type={resultType(result)}
                        className="h-12 w-8 shrink-0"
                        iconClassName="h-4 w-4"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <ItemTitle
                        title={result.title}
                        originalTitle={result.originalTitle}
                        className="truncate font-medium"
                      />
                      {result.subtitle && (
                        <p className="truncate text-xs text-muted">{result.subtitle}</p>
                      )}
                    </div>
                    {result.rating && <RatingBadge rating={result.rating} variant="inline" />}
                    {globalSearch && "type" in result && <TypeBadge type={result.type} />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && !selected && query.length >= 2 && results.length === 0 && canSearch && (
            <p className="mt-2 text-xs text-muted">
              No matches — try another spelling, paste a link above, or type manually.
            </p>
          )}

          {type && (
            <p className="mt-2 text-xs text-muted">
              Category: <strong>{getTypeLabel(type)}</strong>
            </p>
          )}

          <label htmlFor="item-subtitle" className="mb-1 mt-4 block text-sm font-medium">
            Subtitle / author (optional)
          </label>
          <input
            id="item-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={inputClass}
          />

          {progressFields?.pages && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-page" className="mb-1 block text-sm font-medium">
                  Current page
                </label>
                <input
                  id="item-page"
                  type="number"
                  min={0}
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  placeholder="42"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="item-total-pages" className="mb-1 block text-sm font-medium">
                  Total pages
                </label>
                <input
                  id="item-total-pages"
                  type="number"
                  min={0}
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder="280"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {progressFields?.time && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-watched" className="mb-1 block text-sm font-medium">
                  Watched (min)
                </label>
                <input
                  id="item-watched"
                  type="number"
                  min={0}
                  value={watchedMinutes}
                  onChange={(e) => setWatchedMinutes(e.target.value)}
                  placeholder="45"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="item-total-min" className="mb-1 block text-sm font-medium">
                  Total (min)
                </label>
                <input
                  id="item-total-min"
                  type="number"
                  min={0}
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(e.target.value)}
                  placeholder="120"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {progressFields?.episode && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-season" className="mb-1 block text-sm font-medium">
                  Season
                </label>
                <input
                  id="item-season"
                  type="number"
                  min={0}
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="item-episode" className="mb-1 block text-sm font-medium">
                  Episode
                </label>
                <input
                  id="item-episode"
                  type="number"
                  min={0}
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                  placeholder="5"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {progressFields?.hours && (
            <div className="mt-4">
              <label htmlFor="item-hours" className="mb-1 block text-sm font-medium">
                Hours played
              </label>
              <input
                id="item-hours"
                type="number"
                min={0}
                step={0.5}
                value={hoursPlayed}
                onChange={(e) => setHoursPlayed(e.target.value)}
                placeholder="12"
                className={inputClass}
              />
            </div>
          )}

          <label htmlFor="item-status" className="mb-2 mt-4 block text-sm font-medium">
            Status
          </label>
          <StatusPicker value={status} onChange={setStatus} fullWidth />

          <label htmlFor="item-notes" className="mb-1 mt-4 block text-sm font-medium">
            Notes (optional)
          </label>
          <textarea
            id="item-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any extra notes…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="submit"
            disabled={!query.trim() || !type}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {mode === "add" ? "Add item" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
