import { Image } from "@/components/Image";
import { Share2 } from "@/components/icons";
import { Link } from "@/components/Link";
import type { ProfileSummary } from "@/lib/profile-types";

interface ProfileRowProps {
  profile: ProfileSummary;
  onShare?: (profile: ProfileSummary) => void;
  showActions?: boolean;
}

export function ProfileRow({ profile, onShare, showActions = true }: ProfileRowProps) {
  if (!profile.username) return null;

  const label = profile.name ?? profile.username;

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
      <Link
        href={`/u/${profile.username}`}
        className="flex min-w-0 flex-1 items-center gap-3 no-underline hover:opacity-90"
      >
        {profile.imageUrl ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <Image
              src={profile.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
              unoptimized
            />
          </div>
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-1 line-clamp-2 text-sm text-muted">{profile.bio}</p>}
        </div>
      </Link>
      {showActions && (
        <div className="flex shrink-0 gap-1">
          {onShare && (
            <button
              type="button"
              onClick={() => onShare(profile)}
              className="rounded-lg p-2 text-muted hover:bg-muted/60 hover:text-foreground"
              title="Share profile"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          <Link
            href={`/u/${profile.username}`}
            className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent no-underline hover:bg-accent/20"
          >
            View
          </Link>
        </div>
      )}
    </li>
  );
}
