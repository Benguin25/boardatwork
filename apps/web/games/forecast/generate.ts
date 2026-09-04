import { createRng, hashSeed, type Difficulty } from "@boardatwork/game-core";
import questionsJson from "@/content/forecast.json" with { type: "json" };
import type { ForecastQuestion } from "@/lib/content/forecast-schema";

export const QUESTION_COUNT = 5;

const QUESTIONS = questionsJson as readonly ForecastQuestion[];

export interface ForecastPuzzle {
  seed: number;
  difficulty: Difficulty;
  questions: readonly ForecastQuestion[];
}

export function dailySeed(dateKey: string): number {
  return hashSeed("forecast", dateKey);
}

export function practiceSeed(counter: number): number {
  return hashSeed("forecast", "practice", counter);
}

/**
 * Picks 5 distinct questions deterministically from the content pack.
 * Questions tagged with the requested `difficulty` are shuffled first and
 * take priority; the rest of the pool (shuffled separately) fills in
 * behind them. This keeps most of a puzzle at the requested difficulty
 * while still guaranteeing 5 distinct picks even if a difficulty tier has
 * fewer than 5 entries, and stays deterministic since both shuffles are
 * driven by the same seeded `Rng` (SPEC §2.4: "blend difficulty, your
 * call, just keep it deterministic and documented").
 */
export function generate(seed: number, difficulty: Difficulty): ForecastPuzzle {
  const rng = createRng(seed);
  const matching = QUESTIONS.filter((q) => q.difficulty === difficulty);
  const rest = QUESTIONS.filter((q) => q.difficulty !== difficulty);
  const combined = [...rng.shuffle(matching), ...rng.shuffle(rest)];
  const questions = combined.slice(0, QUESTION_COUNT);
  return { seed, difficulty, questions };
}
