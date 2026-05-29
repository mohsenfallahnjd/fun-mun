import { TypeIcon } from "@/components/TypeBadge";
import type { LeisureType } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";

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
      className={`relative flex items-center justify-center overflow-hidden rounded-xl ${TYPE_COLORS[type]} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/5" />
      <TypeIcon type={type} className={`relative ${iconClassName}`} strokeWidth={1.5} />
    </div>
  );
}
