import type { LeisureStatus } from "@/lib/types";
import { STATUS_OPTIONS } from "@/lib/types";

interface StatusPickerProps {
  value: LeisureStatus;
  onChange: (status: LeisureStatus) => void;
  size?: "sm" | "md";
}

export function StatusPicker({ value, onChange, size = "md" }: StatusPickerProps) {
  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/30 p-0.5">
      {STATUS_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg font-medium transition-all ${pad} ${
              active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
