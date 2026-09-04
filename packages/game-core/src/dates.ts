import { InvalidDateKeyError } from "./errors";
import type { Difficulty } from "./types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Formats a `Date` as a `YYYY-MM-DD` key using its local calendar date. */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${String(year)}-${month}-${day}`;
}

export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_PATTERN.test(key)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = key.split("-") as [string, string, string];
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Parses a `YYYY-MM-DD` key into a local-midnight `Date`. Throws on an invalid key. */
export function dateKeyToLocalDate(key: string): Date {
  if (!isValidDateKey(key)) {
    throw new InvalidDateKeyError(key);
  }
  const [yearStr, monthStr, dayStr] = key.split("-") as [string, string, string];
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
}

/** Returns the date key `delta` calendar days from `key` (delta may be negative). */
export function addDaysToKey(key: string, delta: number): string {
  const date = dateKeyToLocalDate(key);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

/** JS `Date#getDay()` convention: 0 = Sunday, ..., 6 = Saturday. */
export function weekdayOf(key: string): number {
  return dateKeyToLocalDate(key).getDay();
}

/**
 * Weekday difficulty schedule (SPEC §2.1: "Mon–Wed easy/medium, Thu–Sat
 * hard, Sun 3-word"). Indexed by `Date#getDay()` (0 = Sunday). The
 * Sunday-only "3-word" variant is a Braid-specific extra dimension layered
 * on top of this by Braid's own generator, not part of the generic
 * `Difficulty` enum.
 */
export const WEEKDAY_DIFFICULTY_SCHEDULE: readonly Difficulty[] = [
  "hard", // Sunday
  "easy", // Monday
  "medium", // Tuesday
  "easy", // Wednesday
  "hard", // Thursday
  "hard", // Friday
  "hard", // Saturday
];

export function weekdayDifficulty(key: string): Difficulty {
  const day = weekdayOf(key);
  return WEEKDAY_DIFFICULTY_SCHEDULE[day] as Difficulty;
}
