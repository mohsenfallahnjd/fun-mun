import type { LeisureItem, LeisureType } from "./types";

export type WizardTime = "short" | "medium" | "long" | "any";
export type WizardMood = "relax" | "excited" | "learn" | "social" | "any";
export type WizardEnergy = "low" | "medium" | "high" | "any";

export interface WizardAnswers {
  time: WizardTime;
  mood: WizardMood;
  energy: WizardEnergy;
  types: LeisureType[];
}

const TIME_TYPE_BOOST: Record<WizardTime, Partial<Record<LeisureType, number>>> = {
  short: { movie: 3, game: 2, podcast: 2 },
  medium: { game: 3, movie: 2, series: 2, podcast: 2 },
  long: { book: 3, series: 3, game: 2, audiobook: 2 },
  any: {},
};

const MOOD_TYPE_BOOST: Record<WizardMood, Partial<Record<LeisureType, number>>> = {
  relax: { movie: 3, audiobook: 2, hobby: 2, book: 1 },
  excited: { game: 3, movie: 2, series: 2 },
  learn: { book: 3, podcast: 3, audiobook: 2 },
  social: { hobby: 3, game: 2, movie: 2, series: 2 },
  any: {},
};

const ENERGY_TYPE_BOOST: Record<WizardEnergy, Partial<Record<LeisureType, number>>> = {
  low: { book: 2, audiobook: 2, movie: 2, podcast: 2 },
  medium: { series: 2, game: 2, movie: 2 },
  high: { game: 3, hobby: 2, series: 2 },
  any: {},
};

function scoreItem(item: LeisureItem, answers: WizardAnswers): number {
  if (item.status === "done") return -1;

  let score = item.status === "active" ? 5 : 1;

  if (answers.types.length > 0 && !answers.types.includes(item.type)) {
    return -1;
  }

  score += TIME_TYPE_BOOST[answers.time][item.type] ?? 0;
  score += MOOD_TYPE_BOOST[answers.mood][item.type] ?? 0;
  score += ENERGY_TYPE_BOOST[answers.energy][item.type] ?? 0;

  return score;
}

export function pickWizardSuggestion(
  items: LeisureItem[],
  answers: WizardAnswers,
): LeisureItem | null {
  const scored = items
    .map((item) => ({ item, score: scoreItem(item, answers) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const topScore = scored[0].score;
  const topTier = scored.filter((s) => s.score >= topScore - 1);
  return topTier[Math.floor(Math.random() * topTier.length)].item;
}

export function pickSuggestion(
  items: LeisureItem[],
  preferredTypes?: LeisureType[] | null,
): LeisureItem | null {
  const pool = items.filter((item) => {
    if (item.status === "done") return false;
    if (preferredTypes?.length && !preferredTypes.includes(item.type)) {
      return false;
    }
    return true;
  });

  if (pool.length === 0) return null;

  const active = pool.filter((i) => i.status === "active");
  if (active.length > 0) {
    return active[Math.floor(Math.random() * active.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
