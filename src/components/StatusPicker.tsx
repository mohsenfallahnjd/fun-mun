import type { LucideIcon } from "lucide-react";
import { Bookmark, Check, Play } from "@/components/icons";
import type { LeisureStatus } from "@/lib/types";
import { STATUS_OPTIONS, STATUS_PICKER_ACTIVE } from "@/lib/types";

const STATUS_ICONS: Record<LeisureStatus, LucideIcon> = {
  queue: Bookmark,
  active: Play,
  done: Check,
};

interface StatusPickerProps {
  value: LeisureStatus;
  onChange: (status: LeisureStatus) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export function StatusPicker({
  value,
  onChange,
  size = "md",
  fullWidth = false,
}: StatusPickerProps) {
  const isSm = size === "sm";

  return (
    <div className={`inline-flex rounded-2xl bg-muted/20 p-1 ${fullWidth ? "w-full" : ""}`}>
      {STATUS_OPTIONS.map((option) => {
        const active = value === option.value;
        const Icon = STATUS_ICONS[option.value];
        const label = isSm ? option.shortLabel : option.label;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-200 ${
              fullWidth ? "min-w-0 flex-1" : ""
            } ${isSm ? "px-2 py-2 text-xs sm:px-3" : "px-3 py-2.5 text-sm sm:px-4"} ${
              active
                ? STATUS_PICKER_ACTIVE[option.value]
                : "text-muted hover:bg-muted/30 hover:text-foreground"
            }`}
          >
            <Icon
              className={`shrink-0 ${isSm ? "h-3.5 w-3.5" : "h-4 w-4"} ${active && option.value === "active" ? "fill-current/20" : ""}`}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
