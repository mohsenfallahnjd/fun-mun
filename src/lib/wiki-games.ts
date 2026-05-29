export function cleanGameTitle(title: string): string {
  return title.replace(/ \(\d{4} video game\)$/i, "").replace(/ \(video game\)$/i, "");
}

export function yearFromGameDescription(description?: string): number | undefined {
  const match = description?.match(/\b(19|20)\d{2}\b/);
  if (!match) return undefined;
  const year = parseInt(match[0], 10);
  return Number.isNaN(year) ? undefined : year;
}

export function isWikiVideoGameArticle(title: string, description?: string): boolean {
  if (title.startsWith("List of")) return false;

  const desc = (description ?? "").toLowerCase();
  const excluded = [
    "video game console",
    "home video game console",
    "video game industry",
    "video game genre",
    "video game developer",
    "video game publisher",
    "video game company",
    "video game award",
    "video game magazine",
  ];
  if (excluded.some((phrase) => desc.startsWith(phrase))) return false;

  if (title.endsWith("(video game)")) return true;
  if (/\b(19|20)\d{2}\b.*video game\b/i.test(description ?? "")) return true;
  if (/\bvideo game\b/i.test(description ?? "")) return true;

  return false;
}

export const GAME_WIKI_CATEGORIES = [
  "Category:2024_video_games",
  "Category:2023_video_games",
  "Category:2022_video_games",
  "Category:2021_video_games",
  "Category:2020_video_games",
  "Category:Indie_video_games",
  "Category:Action-adventure_games",
  "Category:Role-playing_video_games",
  "Category:Open_world_video_games",
  "Category:Multiplayer_online_games",
] as const;
