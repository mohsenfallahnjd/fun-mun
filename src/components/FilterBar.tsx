"use client";

import { TypeIcon } from "@/components/TypeBadge";
import type { LeisureType } from "@/lib/types";
import { LEISURE_TYPES } from "@/lib/types";

interface FilterBarProps {
  active: LeisureType | "all";
  onChange: (type: LeisureType | "all") => void;
  counts: Record<LeisureType | "all", number>;
}

export function FilterBar({ active, onChange, counts }: FilterBarProps) {
  const filters: { value: LeisureType | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...LEISURE_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-surface border border-border text-muted hover:border-accent/30 hover:text-foreground"
            }`}
          >
            {value !== "all" && <TypeIcon type={value} className="h-3.5 w-3.5" />}
            {label}
            <span
              className={`rounded-full px-1.5 text-xs ${isActive ? "bg-white/20" : "bg-muted/80"}`}
            >
              {counts[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
