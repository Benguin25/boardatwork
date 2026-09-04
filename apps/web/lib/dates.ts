// Puzzle dates are `YYYY-MM-DD` keys, never local `Date` objects
// (CLAUDE.md). The core implementation is framework-free and lives in
// @boardatwork/game-core (Stage 1) so games can use it without depending
// on the web app; this file re-exports it under the app's conventional
// `lib/dates.ts` path and adds the presentation-only helpers the shell
// needs.
import { dateKeyToLocalDate } from "@boardatwork/game-core";

export {
  WEEKDAY_DIFFICULTY_SCHEDULE,
  addDaysToKey,
  dateKeyToLocalDate,
  isValidDateKey,
  localDateKey,
  weekdayDifficulty,
  weekdayOf,
} from "@boardatwork/game-core";

/**
 * Launch day: puzzle #1 (SPEC §3.1 shows a puzzle number beside the
 * wordmark). Kept app-side rather than in `game-core` because it is a
 * presentation detail — no engine or seed depends on it.
 */
const EPOCH_KEY = "2025-01-01";
const MS_PER_DAY = 86_400_000;

/** 1-based puzzle number for a `YYYY-MM-DD` key. */
export function puzzleNumber(dateKey: string): number {
  const days = Math.round(
    (dateKeyToLocalDate(dateKey).getTime() - dateKeyToLocalDate(EPOCH_KEY).getTime()) /
      MS_PER_DAY,
  );
  return days + 1;
}

/** "Thursday, September 4" — the Play skin's date line. */
export function formatPuzzleDate(dateKey: string): string {
  return dateKeyToLocalDate(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
