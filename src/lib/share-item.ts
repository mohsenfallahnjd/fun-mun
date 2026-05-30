import { getTypeLabel, type LeisureItem, STATUS_OPTIONS } from "@/lib/types";

export type ShareItemResult = "shared" | "copied" | "cancelled";

export function leisureItemPageUrl(id: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/items/${id}`;
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

function clipboardPayload(item: LeisureItem, itemPageUrl: string): string {
  const text = leisureItemShareText(item);
  const lines = [text, ""];

  if (item.watchUrl && item.watchUrl !== itemPageUrl) {
    lines.push(item.watchUrl, "", `Fun Mun: ${itemPageUrl}`);
  } else {
    lines.push(itemPageUrl);
  }

  return lines.join("\n");
}

export async function shareLeisureItem(item: LeisureItem): Promise<ShareItemResult> {
  const pageUrl = leisureItemPageUrl(item.id);
  const title = leisureItemShareTitle(item);
  const text = leisureItemShareText(item);
  const shareUrl = item.watchUrl ?? pageUrl;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url: shareUrl });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }

  await navigator.clipboard.writeText(clipboardPayload(item, pageUrl));
  return "copied";
}
