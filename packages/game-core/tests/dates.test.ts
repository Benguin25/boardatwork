import { describe, expect, it } from "vitest";
import {
  WEEKDAY_DIFFICULTY_SCHEDULE,
  addDaysToKey,
  dateKeyToLocalDate,
  isValidDateKey,
  localDateKey,
  weekdayDifficulty,
  weekdayOf,
} from "../src/dates";
import { InvalidDateKeyError } from "../src/errors";

describe("localDateKey", () => {
  it("formats a Date as YYYY-MM-DD with zero-padding", () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(localDateKey(new Date(2026, 10, 30))).toBe("2026-11-30");
  });

  it("defaults to now", () => {
    expect(isValidDateKey(localDateKey())).toBe(true);
  });
});

describe("isValidDateKey", () => {
  it("accepts well-formed real dates", () => {
    expect(isValidDateKey("2026-09-04")).toBe(true);
    expect(isValidDateKey("2024-02-29")).toBe(true); // leap day
  });

  it("rejects malformed strings", () => {
    expect(isValidDateKey("2026-9-4")).toBe(false);
    expect(isValidDateKey("not-a-date")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });

  it("rejects calendar-invalid dates that Date would silently roll over", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2023-02-29")).toBe(false); // not a leap year
    expect(isValidDateKey("2026-13-01")).toBe(false);
  });
});

describe("dateKeyToLocalDate", () => {
  it("parses a valid key to local midnight", () => {
    const date = dateKeyToLocalDate("2026-09-04");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(4);
  });

  it("throws InvalidDateKeyError for an invalid key", () => {
    expect(() => dateKeyToLocalDate("bogus")).toThrow(InvalidDateKeyError);
  });
});

describe("addDaysToKey", () => {
  it("adds and subtracts days, including across month/year boundaries", () => {
    expect(addDaysToKey("2026-09-04", 1)).toBe("2026-09-05");
    expect(addDaysToKey("2026-09-04", -1)).toBe("2026-09-03");
    expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-09-04", 0)).toBe("2026-09-04");
  });
});

describe("weekdayOf / weekdayDifficulty", () => {
  it("matches Date#getDay() and the SPEC §2.1 schedule", () => {
    // 2026-09-06 is a Sunday.
    expect(weekdayOf("2026-09-06")).toBe(0);
    expect(weekdayOf("2026-09-07")).toBe(1); // Monday
    expect(WEEKDAY_DIFFICULTY_SCHEDULE).toHaveLength(7);
    expect(weekdayDifficulty("2026-09-06")).toBe("hard"); // Sunday
    expect(weekdayDifficulty("2026-09-07")).toBe("easy"); // Monday
    expect(weekdayDifficulty("2026-09-08")).toBe("medium"); // Tuesday
    expect(weekdayDifficulty("2026-09-09")).toBe("easy"); // Wednesday
    expect(weekdayDifficulty("2026-09-10")).toBe("hard"); // Thursday
    expect(weekdayDifficulty("2026-09-11")).toBe("hard"); // Friday
    expect(weekdayDifficulty("2026-09-12")).toBe("hard"); // Saturday
  });
});
