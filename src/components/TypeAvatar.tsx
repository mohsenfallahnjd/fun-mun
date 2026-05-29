import { TypeIcon } from "@/components/TypeBadge";
import type { LeisureType } from "@/lib/types";

const AVATAR_STYLES: Record<LeisureType, string> = {
  book: "bg-[var(--tag-book-bg)] text-[var(--tag-book)]",
  audiobook: "bg-[var(--tag-audiobook-bg)] text-[var(--tag-audiobook)]",
  podcast: "bg-[var(--tag-podcast-bg)] text-[var(--tag-podcast)]",
  movie: "bg-[var(--tag-movie-bg)] text-[var(--tag-movie)]",
  series: "bg-[var(--tag-series-bg)] text-[var(--tag-series)]",
  place: "bg-[var(--tag-place-bg)] text-[var(--tag-place)]",
};

interface TypeAvatarProps {
  type: LeisureType;
  className?: string;
  iconClassName?: string;
}

export function TypeAvatar({
  type,
  className = "h-full w-full",
  iconClassName = "h-8 w-8",
}: TypeAvatarProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl ${AVATAR_STYLES[type]} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/5" />
      <TypeIcon type={type} className={`relative ${iconClassName}`} strokeWidth={1.5} />
    </div>
  );
}
