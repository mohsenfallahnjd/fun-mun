"use client";

import { useState } from "react";
import { Image } from "@/components/Image";
import { ItemBadges } from "@/components/ItemBadges";
import { ChevronDown, Play, Shuffle, Sparkles } from "@/components/icons";
import { Link } from "@/components/Link";
import { TypeAvatar } from "@/components/TypeAvatar";
import { pickSuggestion } from "@/lib/suggestions";
import type { LeisureItem, LeisureType } from "@/lib/types";

interface SuggestionPanelProps {
  items: LeisureItem[];
  filterType: LeisureType | "all";
  onStart: (id: string) => void;
}

export function SuggestionPanel({ items, filterType, onStart }: SuggestionPanelProps) {
  const [suggestion, setSuggestion] = useState<LeisureItem | null>(null);
  const [key, setKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const suggest = () => {
    const types = filterType === "all" ? null : [filterType];
    const pick = pickSuggestion(items, types);
    setSuggestion(pick);
    setKey((k) => k + 1);
    setExpanded(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-surface sm:rounded-3xl">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

      {/* Mobile: compact row */}
      <div className="relative flex items-center gap-3 p-3 sm:hidden">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">What should I do tonight?</p>
          {!suggestion && (
            <p className="truncate text-xs text-muted">Random pick from your queue</p>
          )}
        </div>
        <button
          type="button"
          onClick={suggest}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Suggest
        </button>
        {(suggestion || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="rounded-lg p-1.5 text-muted hover:bg-muted/40"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Desktop: full layout */}
      <div className="relative hidden flex-col gap-4 p-6 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Leisure suggestion</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">What should I do tonight?</h2>
          <p className="mt-1 text-sm text-muted">
            Pick something from your queue at random, or try the{" "}
            <Link href="/wizard" className="font-medium">
              suggestion wizard
            </Link>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={suggest}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-110 hover:shadow-md active:scale-[0.98]"
        >
          <Shuffle className="h-4 w-4" />
          Suggest
        </button>
      </div>

      {suggestion && (
        <div
          key={key}
          className={`relative flex flex-col gap-3 border-t border-border/60 px-3 pb-3 pt-3 sm:mx-0 sm:mt-5 sm:flex-row sm:items-center sm:border-0 sm:p-0 sm:px-6 sm:pb-6 ${
            expanded ? "" : "hidden sm:flex"
          }`}
        >
          {suggestion.imageUrl ? (
            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-20 sm:rounded-xl">
              <Image
                src={suggestion.imageUrl}
                alt={suggestion.title}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
          ) : (
            <TypeAvatar
              type={suggestion.type}
              className="h-20 w-14 shrink-0 sm:h-28 sm:w-20"
              iconClassName="h-7 w-7 sm:h-9 sm:w-9"
            />
          )}

          <div className="min-w-0 flex-1">
            <ItemBadges
              type={suggestion.type}
              watchUrl={suggestion.watchUrl}
              rating={suggestion.rating}
            />
            <h3 className="mt-1 text-base font-semibold sm:mt-2 sm:text-lg">{suggestion.title}</h3>
            {suggestion.subtitle && (
              <p className="line-clamp-2 text-xs text-muted sm:text-sm">{suggestion.subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onStart(suggestion.id)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 sm:w-auto sm:py-2"
          >
            <Play className="h-4 w-4" />
            Start this
          </button>
        </div>
      )}

      {!suggestion && (
        <p className="relative hidden px-6 pb-6 text-sm text-muted sm:block">
          Press Suggest to get a random pick from your list.
        </p>
      )}
    </section>
  );
}
