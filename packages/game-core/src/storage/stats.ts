import { addDaysToKey } from "../dates";
import type { GameResult, GameStats } from "./types";

/**
 * Derives stats (SPEC §3.4: played, win %, current streak, best streak,
 * checks-used distribution) from a game's result history. A streak is a
 * run of wins on calendar-consecutive `dateKey`s; `currentStreak` is the
 * run ending at the most recent result, `bestStreak` the longest run seen.
 */
export function computeStats(game: string, results: readonly GameResult[]): GameStats {
  const sorted = results
    .filter((result) => result.game === game)
    .slice()
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  let won = 0;
  let running = 0;
  let bestStreak = 0;
  let prevKey: string | undefined;
  const checksDistribution: Record<string, number> = {};

  for (const result of sorted) {
    if (result.won) {
      won += 1;
      const key = String(result.checksUsed);
      checksDistribution[key] = (checksDistribution[key] ?? 0) + 1;

      const isConsecutive =
        prevKey !== undefined && addDaysToKey(prevKey, 1) === result.dateKey;
      running = isConsecutive ? running + 1 : 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
    prevKey = result.dateKey;
  }

  return {
    game,
    played: sorted.length,
    won,
    currentStreak: running,
    bestStreak,
    checksDistribution,
  };
}
