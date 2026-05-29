"use client";

import type { SortMode } from "@/lib/sort";
import { SORT_OPTIONS } from "@/lib/sort";
import type { LeisureType } from "@/lib/types";
import { LEISURE_TYPES } from "@/lib/types";

interface ListToolbarProps {
  filter: LeisureType | "all";
  onFilterChange: (type: LeisureType | "all") => void;
  counts: Record<LeisureType | "all", number>;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}

export function ListToolbar({
  filter,
  onFilterChange,
  counts,
  sortMode,
  onSortChange,
}: ListToolbarProps) {
  const filters: { value: LeisureType | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...LEISURE_TYPES.filter((t) => counts[t.value] > 0).map((t) => ({
      value: t.value,
      label: t.label,
    })),
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {filters.map(({ value, label }) => {
          const isActive = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <label htmlFor="sort-mode" className="sr-only">
        Sort list
      </label>
      <select
        id="sort-mode"
        value={sortMode}
        onChange={(e) => onSortChange(e.target.value as SortMode)}
        className="shrink-0 rounded-lg border-0 bg-muted/30 py-1.5 pl-2 pr-7 text-sm font-medium text-muted outline-none ring-accent/30 focus:ring-2"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
