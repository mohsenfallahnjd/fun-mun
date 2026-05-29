import { unstable_cache } from "next/cache";
import { tmdbFetch } from "@/lib/tmdb";

export interface ResolvedTitle {
  title: string;
  originalTitle?: string;
}

/** Prefer English display title; keep original when it differs. */
export function resolveDisplayTitle(
  localized: string,
  original?: string,
  originalLanguage?: string,
  englishOverride?: string,
): ResolvedTitle {
  const primary = localized.trim() || original?.trim() || "Unknown";
  const orig = original?.trim();
  const english = englishOverride?.trim();

  if (english && english !== primary) {
    return {
      title: english,
      originalTitle: orig && orig !== english ? orig : primary !== english ? primary : undefined,
    };
  }

  if (!orig || orig === primary) {
    return { title: primary };
  }

  if (originalLanguage === "en") {
    return { title: primary, originalTitle: orig !== primary ? orig : undefined };
  }

  return { title: primary, originalTitle: orig };
}

function pickEnglishFromTranslations(
  kind: "movie" | "tv",
  translations: Array<{ iso_639_1?: string; data?: { title?: string; name?: string } }>,
): string | undefined {
  const en = translations.find((t) => t.iso_639_1 === "en");
  const value = kind === "movie" ? en?.data?.title : en?.data?.name;
  return value?.trim() || undefined;
}

async function fetchTmdbEnglishTitleUncached(
  kind: "movie" | "tv",
  id: string,
): Promise<string | undefined> {
  const res = await tmdbFetch(`${kind}/${id}/translations`);
  if (!res?.ok) return undefined;

  const data = (await res.json()) as {
    translations?: Array<{ iso_639_1?: string; data?: { title?: string; name?: string } }>;
  };

  return pickEnglishFromTranslations(kind, data.translations ?? []);
}

export function getCachedTmdbEnglishTitle(kind: "movie" | "tv", id: string) {
  return unstable_cache(
    () => fetchTmdbEnglishTitleUncached(kind, id),
    ["tmdb-en-title", kind, id],
    { revalidate: 86400 },
  )();
}

export async function resolveTmdbTitle(
  kind: "movie" | "tv",
  id: string,
  localized: string,
  original?: string,
  originalLanguage?: string,
): Promise<ResolvedTitle> {
  const loc = localized.trim();
  const orig = original?.trim();
  const lang = originalLanguage?.toLowerCase();

  if (lang && lang !== "en" && (!orig || loc === orig)) {
    const english = await getCachedTmdbEnglishTitle(kind, id);
    if (english) {
      return resolveDisplayTitle(loc, orig ?? loc, lang, english);
    }
  }

  return resolveDisplayTitle(loc, orig, lang);
}
