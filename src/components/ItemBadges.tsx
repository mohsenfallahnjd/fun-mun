import { SourceBadge } from "@/components/SourceBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { resolveItemSource, type SourceInput } from "@/lib/source";
import type { LeisureType } from "@/lib/types";

interface ItemBadgesProps extends SourceInput {
  type: LeisureType;
  className?: string;
}

export function ItemBadges({ type, className = "", ...sourceInput }: ItemBadgesProps) {
  const source = resolveItemSource(sourceInput);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <TypeBadge type={type} />
      {source && <SourceBadge source={source} />}
    </div>
  );
}
