import { Star } from "@/components/icons";
import type { ContentRating } from "@/lib/rating";
import { formatRatingLabel, formatRatingScore } from "@/lib/rating";

export function RatingBadge({
  rating,
  variant = "overlay",
  className = "",
}: {
  rating: ContentRating;
  variant?: "overlay" | "inline" | "detail";
  className?: string;
}) {
  const score = formatRatingScore(rating);
  const label = variant === "detail" ? formatRatingLabel(rating) : score;

  if (variant === "overlay") {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm ${className}`}
      >
        <Star className="h-3 w-3 fill-current" aria-hidden />
        {score}
      </span>
    );
  }

  if (variant === "detail") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300 ${className}`}
      >
        <Star className="h-4 w-4 fill-current" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 ${className}`}
    >
      <Star className="h-3 w-3 fill-current" aria-hidden />
      {score}
    </span>
  );
}
