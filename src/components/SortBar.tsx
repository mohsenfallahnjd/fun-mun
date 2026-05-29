"use client";

import { ArrowUpDown } from "@/components/icons";
import type { SortMode } from "@/lib/sort";
import { SORT_OPTIONS } from "@/lib/sort";

interface SortBarProps {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  manualHint?: boolean;
}

export function SortBar({ value, onChange, manualHint }: SortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted" />
      <label htmlFor="sort-mode" className="sr-only">
        Sort list
      </label>
      <select
        id="sort-mode"
        value={value}
        onChange={(e) => onChange(e.target.value as SortMode)}
        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium outline-none ring-accent/30 focus:ring-2"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {manualHint && value === "manual" && (
        <span className="text-xs text-muted">Drag cards to reorder</span>
      )}
    </div>
  );
}
