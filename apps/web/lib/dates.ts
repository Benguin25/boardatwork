// Puzzle dates are `YYYY-MM-DD` keys, never local `Date` objects
// (CLAUDE.md). The implementation is framework-free and lives in
// @boardatwork/game-core (Stage 1) so games can use it without depending
// on the web app; this file just re-exports it under the app's
// conventional `lib/dates.ts` path.
export {
  WEEKDAY_DIFFICULTY_SCHEDULE,
  addDaysToKey,
  dateKeyToLocalDate,
  isValidDateKey,
  localDateKey,
  weekdayDifficulty,
  weekdayOf,
} from "@boardatwork/game-core";
