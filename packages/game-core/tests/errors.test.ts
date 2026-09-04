import { describe, expect, it } from "vitest";
import { InvalidChallengeCodeError, InvalidDateKeyError } from "../src/errors";

describe("InvalidDateKeyError", () => {
  it("names the offending key", () => {
    const error = new InvalidDateKeyError("not-a-date");
    expect(error.name).toBe("InvalidDateKeyError");
    expect(error.message).toContain("not-a-date");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("InvalidChallengeCodeError", () => {
  it("names the reason", () => {
    const error = new InvalidChallengeCodeError("not valid JSON");
    expect(error.name).toBe("InvalidChallengeCodeError");
    expect(error.message).toContain("not valid JSON");
    expect(error).toBeInstanceOf(Error);
  });
});
