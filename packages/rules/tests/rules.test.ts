import { describe, expect, it } from "vitest";
import { RULES } from "../src/rules";

/**
 * One satisfying and one non-satisfying real, unambiguous word per rule —
 * this table doubles as documentation of each rule's intended behaviour
 * (per the task's instructions) and drives 100% coverage of every `test`
 * function below.
 */
const CASES: Record<string, { yes: string; no: string }> = {
  "double-letter": { yes: "puppy", no: "table" },
  "same-first-last": { yes: "level", no: "table" },
  "no-vowels-except-e": { yes: "tree", no: "table" },
  "all-five-vowels": { yes: "education", no: "table" },
  isogram: { yes: "world", no: "puppy" },
  "more-consonants-than-vowels": { yes: "strength", no: "banana" },
  "no-letter-more-than-twice": { yes: "letter", no: "banana" },
  "three-distinct-vowels": { yes: "beautiful", no: "cat" },
  "double-vowel": { yes: "tree", no: "table" },
  "double-consonant": { yes: "puppy", no: "table" },
  "alphabetical-order": { yes: "almost", no: "table" },
  "reverse-alphabetical-order": { yes: "spoon", no: "table" },
  "first-half-alphabet": { yes: "cage", no: "story" },
  "second-half-alphabet": { yes: "story", no: "cage" },
  "has-second-half-letter": { yes: "story", no: "cab" },
  "first-before-last": { yes: "apple", no: "table" },
  "contains-q-or-z": { yes: "quiz", no: "table" },
  "left-hand-only": { yes: "sweater", no: "monkey" },
  "right-hand-only": { yes: "jump", no: "sweater" },
  "top-row-only": { yes: "pottery", no: "jump" },
  "home-row-only": { yes: "flask", no: "pottery" },
  palindrome: { yes: "level", no: "table" },
  "prime-length": { yes: "apple", no: "tree" },
  "even-length": { yes: "tree", no: "apple" },
  "odd-length": { yes: "apple", no: "tree" },
  "starts-vowel-ends-consonant": { yes: "under", no: "apple" },
  "starts-consonant-ends-vowel": { yes: "table", no: "under" },
  "multiple-of-three-length": { yes: "garden", no: "apple" },
  "long-word": { yes: "elephant", no: "cat" },
  "short-word": { yes: "frog", no: "elephant" },
  "square-length": { yes: "frog", no: "apple" },
  "second-letter-vowel": { yes: "bear", no: "story" },
  "second-last-letter-vowel": { yes: "seven", no: "story" },
  "exactly-one-vowel": { yes: "cat", no: "table" },
  "exactly-two-vowels": { yes: "table", no: "cat" },
  "no-vowels": { yes: "gym", no: "cat" },
  "more-unique-than-repeated": { yes: "table", no: "banana" },
  "contains-no-e": { yes: "quick", no: "tree" },
  "ends-with-e": { yes: "table", no: "quick" },
  "contains-y": { yes: "happy", no: "table" },
  "consonant-cluster": { yes: "string", no: "table" },
  "vowel-heavy": { yes: "idea", no: "string" },
  "no-double-letters": { yes: "table", no: "puppy" },
};

describe("RULES", () => {
  it("has at least 40 rules", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(40);
  });

  it("has a non-empty, unique id and description for every rule", () => {
    const ids = new Set<string>();
    for (const rule of RULES) {
      expect(rule.id.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
    }
    expect(ids.size).toBe(RULES.length);
  });

  it("has a test case for every rule, and no orphaned cases", () => {
    const ruleIds = new Set(RULES.map((r) => r.id));
    expect(Object.keys(CASES).sort()).toEqual([...ruleIds].sort());
  });

  for (const rule of RULES) {
    describe(rule.id, () => {
      const example = CASES[rule.id];
      if (!example) {
        throw new Error(`Missing test case for rule "${rule.id}"`);
      }

      it(`"${example.yes}" satisfies: ${rule.description}`, () => {
        expect(rule.test(example.yes)).toBe(true);
      });

      it(`"${example.no}" does not satisfy: ${rule.description}`, () => {
        expect(rule.test(example.no)).toBe(false);
      });
    });
  }

  it("normalizes stray casing and non-letter characters defensively", () => {
    const doubleLetter = RULES.find((r) => r.id === "double-letter");
    expect(doubleLetter?.test("PUP-PY!")).toBe(true);
    expect(doubleLetter?.test("")).toBe(false);
  });

  it("every rule rejects an empty/all-non-letter word (defensive guards)", () => {
    for (const rule of RULES) {
      expect(rule.test("")).toBe(false);
      expect(rule.test("123!!!")).toBe(false);
    }
  });
});
