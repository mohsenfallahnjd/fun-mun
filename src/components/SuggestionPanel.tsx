"use client";

import { useState } from "react";
import { Image } from "@/components/Image";
import { Play, Shuffle, Sparkles } from "@/components/icons";
import { TypeAvatar } from "@/components/TypeAvatar";
import { TypeBadge } from "@/components/TypeBadge";
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

  const suggest = () => {
    const types = filterType === "all" ? null : [filterType];
    const pick = pickSuggestion(items, types);
    setSuggestion(pick);
    setKey((k) => k + 1);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-surface p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Leisure suggestion</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">What should I do tonight?</h2>
          <p className="mt-1 text-sm text-muted">Pick something from your queue at random</p>
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
          className="relative mt-5 flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-4 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur sm:flex-row sm:items-center"
        >
          {suggestion.imageUrl ? (
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl">
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
              className="h-28 w-20 shrink-0"
              iconClassName="h-9 w-9"
            />
          )}

          <div className="min-w-0 flex-1">
            <TypeBadge type={suggestion.type} />
            <h3 className="mt-2 text-lg font-semibold">{suggestion.title}</h3>
            {suggestion.subtitle && <p className="text-sm text-muted">{suggestion.subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={() => onStart(suggestion.id)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <Play className="h-4 w-4" />
            Start this
          </button>
        </div>
      )}

      {!suggestion && (
        <p className="relative mt-4 text-sm text-muted">
          Press Suggest to get a random pick from your list.
        </p>
      )}
    </section>
  );
}
