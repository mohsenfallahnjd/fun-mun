import { BookOpen, Film, Headphones, MapPin, Mic, Tv } from "@/components/icons";
import type { LeisureType } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";

export function TypeIcon({
  type,
  className = "h-4 w-4",
  strokeWidth = 1.75,
}: {
  type: LeisureType;
  className?: string;
  strokeWidth?: number;
}) {
  const props = { className, strokeWidth };

  switch (type) {
    case "book":
      return <BookOpen {...props} />;
    case "audiobook":
      return <Headphones {...props} />;
    case "podcast":
      return <Mic {...props} />;
    case "movie":
      return <Film {...props} />;
    case "series":
      return <Tv {...props} />;
    case "place":
      return <MapPin {...props} />;
  }
}

export function TypeBadge({ type }: { type: LeisureType }) {
  const labels: Record<LeisureType, string> = {
    book: "Book",
    audiobook: "Audiobook",
    podcast: "Podcast",
    movie: "Movie",
    series: "Series",
    place: "Place",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[type]}`}
    >
      <TypeIcon type={type} className="h-3 w-3" />
      {labels[type]}
    </span>
  );
}
