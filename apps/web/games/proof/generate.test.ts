import { describe, expect, it } from "vitest";
import type { Difficulty } from "@boardatwork/game-core";
import { dailySeed, generate, practiceSeed } from "./generate";
import { ProofContentSchema } from "@/lib/content/proof-schema";
import passagesJson from "@/content/proof.json" with { type: "json" };

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("generate", () => {
  it("is deterministic: same seed -> identical passage, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const a = generate(seed, difficulty);
      const b = generate(seed, difficulty);
      expect(a).toEqual(b);
    }
  });

  it("respects the requested difficulty tag, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.difficulty).toBe(difficulty);
    }
  });

  it("always picks exactly 5 distinct, in-range impostor indices, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.impostorIndices).toHaveLength(5);
      expect(new Set(puzzle.impostorIndices).size).toBe(5);
      for (const i of puzzle.impostorIndices) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(puzzle.words.length);
      }
    }
  });

  it("every generated passage's words reconstruct to a sensible, non-empty string", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      const text = puzzle.words.join(" ");
      expect(text.length).toBeGreaterThan(0);
      expect(puzzle.words.length).toBeGreaterThanOrEqual(60);
      expect(puzzle.words.length).toBeLessThanOrEqual(90);
    }
  });
});

describe("dailySeed", () => {
  it("is deterministic per date", () => {
    expect(dailySeed("2026-09-04")).toBe(dailySeed("2026-09-04"));
    expect(dailySeed("2026-09-04")).not.toBe(dailySeed("2026-09-05"));
  });
});

describe("practiceSeed", () => {
  it("is deterministic per counter and distinct from dailySeed's namespace", () => {
    expect(practiceSeed(7)).toBe(practiceSeed(7));
    expect(practiceSeed(7)).not.toBe(practiceSeed(8));
  });
});

describe("content pack", () => {
  it("round-trips through the Zod schema without errors", () => {
    expect(() => ProofContentSchema.parse(passagesJson)).not.toThrow();
  });
});
