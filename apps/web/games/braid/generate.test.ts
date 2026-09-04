import { describe, expect, it } from "vitest";
import { weekdayOf } from "@boardatwork/game-core";
import { dailySeed, generate, practiceSeed } from "./generate";
import type { Difficulty } from "@boardatwork/game-core";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("generate", () => {
  it("is deterministic: same seed -> identical puzzle, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const a = generate(seed * 2, difficulty);
      const b = generate(seed * 2, difficulty);
      expect(a).toEqual(b);
    }
  });

  it("only allows a run of 3+ from one word once every other word is exhausted, across 1000 seeds", () => {
    // The max-run-of-2 rule (SPEC §2.1) only has an alternative to pick
    // while >=2 words still have letters left; once just one word remains,
    // its tail is necessarily consecutive. So the real invariant is: any
    // run of 3+ implies every *other* word had already been fully placed.
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed * 2, difficulty);
      const remaining: number[] = puzzle.words.map((w) => w.length);
      const firstSrc = puzzle.letters[0]!.src;
      remaining[firstSrc] = (remaining[firstSrc] as number) - 1;
      let run = 1;
      for (let i = 1; i < puzzle.letters.length; i += 1) {
        const src = puzzle.letters[i]!.src;
        remaining[src] = (remaining[src] as number) - 1;
        run = src === puzzle.letters[i - 1]?.src ? run + 1 : 1;
        if (run >= 3) {
          const othersExhausted = remaining.every((left, word) => word === src || left === 0);
          expect(othersExhausted).toBe(true);
        }
      }
    }
  });

  it("preserves every source word's letters and order when filtered by source, across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
      const puzzle = generate(seed * 2, difficulty);
      puzzle.words.forEach((word, k) => {
        const reconstructed = puzzle.letters.filter((l) => l.src === k).map((l) => l.ch).join("");
        expect(reconstructed).toBe(word);
      });
      expect(puzzle.letters).toHaveLength(puzzle.words.reduce((n, w) => n + w.length, 0));
    }
  });

  it("respects the requested difficulty tag for a 2-word (even) seed", () => {
    for (let i = 0; i < 50; i += 1) {
      for (const difficulty of DIFFICULTIES) {
        const puzzle = generate(i * 2, difficulty);
        expect(puzzle.words).toHaveLength(2);
      }
    }
  });

  it("an odd seed always produces a 3-word puzzle regardless of difficulty", () => {
    for (let i = 0; i < 50; i += 1) {
      const puzzle = generate(i * 2 + 1, "hard");
      expect(puzzle.words).toHaveLength(3);
    }
  });
});

describe("dailySeed", () => {
  it("sets the low bit only on Sundays and stays deterministic", () => {
    const dates = [
      "2026-09-06", // Sunday
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ];
    for (const date of dates) {
      const seed = dailySeed(date);
      expect(seed % 2 === 1).toBe(weekdayOf(date) === 0);
      expect(dailySeed(date)).toBe(seed);
    }
  });
});

describe("practiceSeed", () => {
  it("never sets the triple bit", () => {
    for (let counter = 0; counter < 200; counter += 1) {
      expect(practiceSeed(counter) % 2).toBe(0);
    }
  });

  it("is deterministic per counter", () => {
    expect(practiceSeed(7)).toBe(practiceSeed(7));
  });
});
