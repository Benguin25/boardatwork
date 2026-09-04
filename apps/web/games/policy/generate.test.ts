import { RULES } from "@boardatwork/rules";
import { describe, expect, it } from "vitest";
import type { Difficulty } from "@boardatwork/game-core";
import {
  CANDIDATE_COUNT,
  dailySeed,
  DECOY_COUNT,
  EASY_RULE_IDS,
  EXAMPLE_COUNT,
  generate,
  HARD_RULE_IDS,
  MEDIUM_RULE_IDS,
  practiceSeed,
  PROBE_CANDIDATE_COUNT,
  WORD_POOL,
} from "./generate";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("difficulty tiers", () => {
  it("partition every rule in RULES exactly once, across the three tiers", () => {
    const combined = [...EASY_RULE_IDS, ...MEDIUM_RULE_IDS, ...HARD_RULE_IDS];
    expect(combined).toHaveLength(RULES.length);
    expect(new Set(combined).size).toBe(RULES.length);
    expect(new Set(combined)).toEqual(new Set(RULES.map((r) => r.id)));
  });
});

describe("WORD_POOL", () => {
  it("has no duplicate words", () => {
    expect(new Set(WORD_POOL).size).toBe(WORD_POOL.length);
  });

  it("gives every rule in RULES at least EXAMPLE_COUNT satisfying words (systematic, all rules)", () => {
    for (const rule of RULES) {
      const matches = WORD_POOL.filter((word) => rule.test(word));
      expect(matches.length, `rule "${rule.id}" has too few matching words in WORD_POOL`).toBeGreaterThanOrEqual(
        EXAMPLE_COUNT,
      );
    }
  });
});

describe("generate", () => {
  it("is deterministic: same seed + difficulty -> identical puzzle, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const a = generate(seed, difficulty);
      const b = generate(seed, difficulty);
      expect(a).toEqual(b);
    }
  });

  it("always produces exactly EXAMPLE_COUNT examples that all satisfy the true rule, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.examples).toHaveLength(EXAMPLE_COUNT);
      const trueRule = RULES.find((r) => r.id === puzzle.trueRuleId);
      expect(trueRule).toBeDefined();
      for (const example of puzzle.examples) {
        expect(trueRule?.test(example)).toBe(true);
      }
    }
  });

  it("picks the true rule from the requested difficulty's tier, across 1000 seeds", () => {
    const tiers: Record<Difficulty, readonly string[]> = {
      easy: EASY_RULE_IDS,
      medium: MEDIUM_RULE_IDS,
      hard: HARD_RULE_IDS,
    };
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(tiers[difficulty]).toContain(puzzle.trueRuleId);
    }
  });

  it("the 10 candidates always include the true rule exactly once plus 9 distinct decoys, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.candidateIds).toHaveLength(CANDIDATE_COUNT);
      expect(new Set(puzzle.candidateIds).size).toBe(CANDIDATE_COUNT);
      expect(puzzle.candidateIds.filter((id) => id === puzzle.trueRuleId)).toHaveLength(1);
      expect(puzzle.candidateIds.filter((id) => id !== puzzle.trueRuleId)).toHaveLength(DECOY_COUNT);
    }
  });

  it("offers PROBE_CANDIDATE_COUNT distinct probe words that never overlap the examples, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.probeCandidates).toHaveLength(PROBE_CANDIDATE_COUNT);
      expect(new Set(puzzle.probeCandidates).size).toBe(PROBE_CANDIDATE_COUNT);
      for (const word of puzzle.probeCandidates) {
        expect(puzzle.examples).not.toContain(word);
      }
    }
  });

  it("different seeds tend to choose different true rules", () => {
    const ruleIds = new Set(Array.from({ length: 50 }, (_, seed) => generate(seed, "hard").trueRuleId));
    expect(ruleIds.size).toBeGreaterThan(1);
  });
});

describe("dailySeed", () => {
  it("is deterministic per date and differs across dates", () => {
    expect(dailySeed("2026-09-04")).toBe(dailySeed("2026-09-04"));
    expect(dailySeed("2026-09-04")).not.toBe(dailySeed("2026-09-05"));
  });
});

describe("practiceSeed", () => {
  it("is deterministic per counter and differs across counters", () => {
    expect(practiceSeed(7)).toBe(practiceSeed(7));
    expect(practiceSeed(7)).not.toBe(practiceSeed(8));
  });

  it("never collides with a daily seed for the same day-string counter", () => {
    expect(practiceSeed(1)).not.toBe(dailySeed("2026-09-04"));
  });
});
