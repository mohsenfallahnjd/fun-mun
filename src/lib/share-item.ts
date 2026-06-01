import { getTypeLabel, type LeisureItem, STATUS_OPTIONS } from "@/lib/types";

export type ShareItemResult = "shared" | "copied" | "cancelled";

export interface ShareItemOptions {
  username?: string;
}

export function leisureItemPageUrl(id: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/items/${id}`;
}

export function publicItemPageUrl(username: string, itemId: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/u/${encodeURIComponent(username)}/items/${itemId}`;
}

export function resolveItemShareUrl(item: LeisureItem, options?: ShareItemOptions) {
  if (options?.username) return publicItemPageUrl(options.username, item.id);
  return leisureItemPageUrl(item.id);
}

export function leisureItemShareTitle(item: Pick<LeisureItem, "title">) {
  return `${item.title} · Fun Mun`;
}

export function leisureItemShareText(
  item: Pick<LeisureItem, "title" | "type" | "subtitle" | "status">,
) {
  const typeLabel = getTypeLabel(item.type);
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === item.status)?.label;
  let text = `I'm saving "${item.title}" (${typeLabel}) on Fun Mun`;

  if (item.subtitle) text += ` — ${item.subtitle}`;
  if (statusLabel) text += `. Status: ${statusLabel}.`;
  text += " Worth adding to your downtime list!";

  return text;
}

function clipboardPayload(item: LeisureItem, pageUrl: string): string {
  const text = leisureItemShareText(item);
  const lines = [text, ""];

  if (item.watchUrl && item.watchUrl !== pageUrl) {
    lines.push(`Original link: ${item.watchUrl}`, "", pageUrl);
  } else {
    lines.push(pageUrl);
  }

  return lines.join("\n");
}

export async function shareLeisureItem(
  item: LeisureItem,
  options?: ShareItemOptions,
): Promise<ShareItemResult> {
  const pageUrl = resolveItemShareUrl(item, options);
  const title = leisureItemShareTitle(item);
  const text = leisureItemShareText(item);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url: pageUrl });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }

  await navigator.clipboard.writeText(clipboardPayload(item, pageUrl));
  return "copied";
}
