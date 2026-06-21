export function profileUrl(username: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/u/${username}`;
}

function displayName(name: string | null | undefined, username: string) {
  const trimmed = name?.trim();
  return trimmed || `@${username}`;
}

export function profileShareTitle(name: string | null | undefined, username: string) {
  return `${displayName(name, username)} on Fun Mun`;
}

export function profileShareText(
  name: string | null | undefined,
  username: string,
  itemCount?: number,
) {
  const who = displayName(name, username);
  const count = itemCount ?? 0;

  if (count > 0) {
    const picks = count === 1 ? "1 leisure pick" : `${count} leisure picks`;
    return `${who} shared ${picks} on Fun Mun — books, movies, series, games & hobbies for your next day off. Worth a peek!`;
  }

  return `See what ${who} saves for downtime on Fun Mun — reads, watches, listens & spots for better leisure time.`;
}

export type ShareProfileResult = "shared" | "copied" | "cancelled";

export async function shareUserProfile(options: {
  username: string;
  name?: string | null;
  itemCount?: number;
}): Promise<ShareProfileResult> {
  const { username, name, itemCount } = options;
  const url = profileUrl(username);
  const title = profileShareTitle(name, username);
  const text = profileShareText(name, username, itemCount);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }

  await navigator.clipboard.writeText(`${text}\n\n${url}`);
  return "copied";
}
