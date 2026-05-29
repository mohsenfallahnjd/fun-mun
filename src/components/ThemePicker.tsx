"use client";

import { useTheme } from "@/components/ThemeProvider";
import { THEMES, type ThemeId } from "@/lib/themes";

interface ThemePickerProps {
  onSelect?: (theme: ThemeId) => void;
  compact?: boolean;
}

export function ThemePicker({ onSelect, compact = false }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();

  const pick = (id: ThemeId) => {
    setTheme(id);
    onSelect?.(id);
  };

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-3 gap-2 sm:grid-cols-6"}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => pick(t.id)}
          title={t.label}
          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
            theme === t.id
              ? "border-accent bg-accent/10 ring-2 ring-accent/30"
              : "border-border hover:border-accent/40 hover:bg-muted/30"
          }`}
        >
          <span
            className="h-8 w-8 rounded-full shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: t.swatch }}
          />
          {!compact && <span className="text-xs font-medium">{t.label}</span>}
        </button>
      ))}
    </div>
  );
}
