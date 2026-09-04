import { describe, expect, it } from "vitest";
import type { Difficulty } from "@boardatwork/game-core";
import { dailySeed, generate, practiceSeed, type OrgAssignment } from "./generate";
import { BREATHE_EVERY, breathe } from "../../tests/support/breathe";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const N = 5;
// Brute-forcing 1,000 seeds is not a fast test. Coverage instrumentation and
// four cores shared with the rest of the suite put these past the 30s this
// used to allow; the work itself is unchanged.
const LOOP_TIMEOUT_MS = 120_000;

function permutations(n: number): number[][] {
  const out: number[][] = [];
  const arr = Array.from({ length: n }, (_, i) => i);
  function permute(k: number): void {
    if (k === arr.length) {
      out.push(arr.slice());
      return;
    }
    for (let i = k; i < arr.length; i += 1) {
      [arr[k], arr[i]] = [arr[i] as number, arr[k] as number];
      permute(k + 1);
      [arr[k], arr[i]] = [arr[i] as number, arr[k] as number];
    }
  }
  permute(0);
  return out;
}

const ALL_PERMS = permutations(N);

/** Independent brute-force re-implementation used only by tests, so a bug in the generator's own uniqueness search can't hide itself. */
function countSolutionsIndependently(clues: readonly { check(candidate: OrgAssignment): boolean }[]): number {
  let count = 0;
  for (const role of ALL_PERMS) {
    for (const team of ALL_PERMS) {
      const candidate: OrgAssignment = { role, team };
      if (clues.every((clue) => clue.check(candidate))) {
        count += 1;
      }
    }
  }
  return count;
}

describe("generate", () => {
  it(
    "is deterministic: same seed -> identical puzzle, across 1000 seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const a = generate(seed, difficulty);
        const b = generate(seed, difficulty);
        expect(a.solution).toEqual(b.solution);
        expect(a.clues.map((c) => c.id)).toEqual(b.clues.map((c) => c.id));
        expect(a.clues.map((c) => c.text)).toEqual(b.clues.map((c) => c.text));
      }
    },
    LOOP_TIMEOUT_MS,
  );

  it(
    "produces a valid bijection for both role and team, across 1000 seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const puzzle = generate(seed, difficulty);
        expect([...puzzle.solution.role].sort()).toEqual([0, 1, 2, 3, 4]);
        expect([...puzzle.solution.team].sort()).toEqual([0, 1, 2, 3, 4]);
      }
    },
    LOOP_TIMEOUT_MS,
  );

  it(
    "every generated clue set is unique (brute force, independent of the generator's own check), across 1000 seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const puzzle = generate(seed, difficulty);
        expect(countSolutionsIndependently(puzzle.clues)).toBe(1);
      }
    },
    LOOP_TIMEOUT_MS,
  );

  it(
    "every generated clue is true of the puzzle's true solution, across 1000 seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const puzzle = generate(seed, difficulty);
        for (const clue of puzzle.clues) {
          expect(clue.check(puzzle.solution)).toBe(true);
        }
      }
    },
    LOOP_TIMEOUT_MS,
  );

  it(
    "clue count lands in a sane range across seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const puzzle = generate(seed, difficulty);
        expect(puzzle.clues.length).toBeGreaterThanOrEqual(4);
        expect(puzzle.clues.length).toBeLessThanOrEqual(7);
      }
    },
    LOOP_TIMEOUT_MS,
  );

  it("respects the fixed vocabulary and records the requested difficulty", () => {
    const puzzle = generate(1, "hard");
    expect(puzzle.people).toHaveLength(5);
    expect(puzzle.roles).toHaveLength(5);
    expect(puzzle.teams).toHaveLength(5);
    expect(puzzle.difficulty).toBe("hard");
  });
});

describe("dailySeed", () => {
  it("is deterministic per date", () => {
    expect(dailySeed("2026-09-04")).toBe(dailySeed("2026-09-04"));
    expect(dailySeed("2026-09-04")).not.toBe(dailySeed("2026-09-05"));
  });
});

describe("practiceSeed", () => {
  it("is deterministic per counter", () => {
    expect(practiceSeed(7)).toBe(practiceSeed(7));
    expect(practiceSeed(7)).not.toBe(practiceSeed(8));
  });
});
