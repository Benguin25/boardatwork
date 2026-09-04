import { createRng } from "@boardatwork/game-core";
import { describe, expect, it } from "vitest";
import { pickDecoyRules, RULES } from "../src/index";

describe("pickDecoyRules", () => {
  it("is deterministic: the same seed produces the same decoys", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const trueRule = RULES[seed % RULES.length] as (typeof RULES)[number];
      const a = pickDecoyRules(trueRule.id, createRng(seed), 9);
      const b = pickDecoyRules(trueRule.id, createRng(seed), 9);
      expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
    }
  });

  it("returns exactly `count` decoys, across many seeds", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const trueRule = RULES[seed % RULES.length] as (typeof RULES)[number];
      const decoys = pickDecoyRules(trueRule.id, createRng(seed), 9);
      expect(decoys).toHaveLength(9);
    }
  });

  it("never includes the true rule, across many seeds", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const trueRule = RULES[seed % RULES.length] as (typeof RULES)[number];
      const decoys = pickDecoyRules(trueRule.id, createRng(seed), 9);
      expect(decoys.some((r) => r.id === trueRule.id)).toBe(false);
    }
  });

  it("never contains duplicate rules, across many seeds", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const trueRule = RULES[seed % RULES.length] as (typeof RULES)[number];
      const decoys = pickDecoyRules(trueRule.id, createRng(seed), 9);
      expect(new Set(decoys.map((r) => r.id)).size).toBe(decoys.length);
    }
  });

  it("different seeds tend to produce different decoy sets", () => {
    const trueRule = RULES[0] as (typeof RULES)[number];
    const a = pickDecoyRules(trueRule.id, createRng(1), 9).map((r) => r.id);
    const b = pickDecoyRules(trueRule.id, createRng(2), 9).map((r) => r.id);
    expect(a).not.toEqual(b);
  });

  it("supports count 0 and the maximum possible count", () => {
    const trueRule = RULES[0] as (typeof RULES)[number];
    expect(pickDecoyRules(trueRule.id, createRng(5), 0)).toEqual([]);
    expect(pickDecoyRules(trueRule.id, createRng(5), RULES.length - 1)).toHaveLength(RULES.length - 1);
  });

  it("throws for a count outside [0, pool size]", () => {
    const trueRule = RULES[0] as (typeof RULES)[number];
    expect(() => pickDecoyRules(trueRule.id, createRng(5), -1)).toThrow(RangeError);
    expect(() => pickDecoyRules(trueRule.id, createRng(5), RULES.length)).toThrow(RangeError);
  });
});
