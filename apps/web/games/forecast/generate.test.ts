import { describe, expect, it } from "vitest";
import type { Difficulty } from "@boardatwork/game-core";
import { ForecastContentSchema } from "@/lib/content/forecast-schema";
import contentJson from "@/content/forecast.json" with { type: "json" };
import { dailySeed, generate, practiceSeed, QUESTION_COUNT } from "./generate";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("generate", () => {
  it("is deterministic: same seed and difficulty -> identical puzzle, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const a = generate(seed, difficulty);
      const b = generate(seed, difficulty);
      expect(a).toEqual(b);
    }
  });

  it("always produces exactly 5 distinct questions, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed, difficulty);
      expect(puzzle.questions).toHaveLength(QUESTION_COUNT);
      const ids = puzzle.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(QUESTION_COUNT);
    }
  });

  it("different seeds tend to produce different puzzles", () => {
    const a = generate(1, "medium");
    const b = generate(2, "medium");
    expect(a.questions.map((q) => q.id)).not.toEqual(b.questions.map((q) => q.id));
  });

  it("prioritizes the requested difficulty when the pool has enough matching questions", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      for (const difficulty of DIFFICULTIES) {
        const puzzle = generate(seed, difficulty);
        // The content pack has >=5 questions per tag (enforced by the
        // schema below), so every pick should be at the requested tier.
        expect(puzzle.questions.every((q) => q.difficulty === difficulty)).toBe(true);
      }
    }
  });
});

describe("dailySeed", () => {
  it("is deterministic per date and varies by date", () => {
    expect(dailySeed("2026-09-04")).toBe(dailySeed("2026-09-04"));
    expect(dailySeed("2026-09-04")).not.toBe(dailySeed("2026-09-05"));
  });
});

describe("practiceSeed", () => {
  it("is deterministic per counter and varies by counter", () => {
    expect(practiceSeed(7)).toBe(practiceSeed(7));
    expect(practiceSeed(7)).not.toBe(practiceSeed(8));
  });
});

describe("content pack", () => {
  it("round-trips through the Zod schema without errors", () => {
    const parsed = ForecastContentSchema.safeParse(contentJson);
    expect(parsed.success).toBe(true);
  });

  it("has at least 5 questions for every difficulty tier (so generate() never has to fall back)", () => {
    const byTag = new Map<Difficulty, number>();
    for (const entry of contentJson as { difficulty: Difficulty }[]) {
      byTag.set(entry.difficulty, (byTag.get(entry.difficulty) ?? 0) + 1);
    }
    for (const difficulty of DIFFICULTIES) {
      expect(byTag.get(difficulty) ?? 0).toBeGreaterThanOrEqual(QUESTION_COUNT);
    }
  });
});
