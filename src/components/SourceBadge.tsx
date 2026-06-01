import { getSourceColor } from "@/lib/source";

export function SourceBadge({ source, className = "" }: { source: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSourceColor(source)} ${className}`}
    >
      {source}
    </span>
  );
}
