import { describe, expect, it } from "vitest";
import type { Difficulty } from "@boardatwork/game-core";
import { GRID_SIZE, dailySeed, generate, isUniqueAlteration, practiceSeed } from "./generate";
import { BREATHE_EVERY, breathe } from "../../tests/support/breathe";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const K_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };

function sumRow(grid: readonly number[], row: number): number {
  let total = 0;
  for (let c = 0; c < GRID_SIZE; c += 1) {
    total += grid[row * GRID_SIZE + c] as number;
  }
  return total;
}

function sumCol(grid: readonly number[], col: number): number {
  let total = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    total += grid[r * GRID_SIZE + col] as number;
  }
  return total;
}

describe("generate", () => {
  // One shared 1000-seed loop generating each puzzle exactly once (instead
  // of one loop per assertion) keeps this fast even under coverage
  // instrumentation, while still exercising every property SPEC §2.2
  // requires: determinism, consistent true totals, exactly k altered cells
  // occupying distinct rows/columns, and brute-force-verified uniqueness.
  it(
    "is deterministic, has consistent true totals, alters exactly k distinct-row/column cells, and is uniquely solvable by brute force, across 1000 seeds",
    async () => {
      for (let seed = 0; seed < 1000; seed += 1) {
        if (seed % BREATHE_EVERY === 0) {
          await breathe();
        }
        const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length] as Difficulty;
        const k = K_BY_DIFFICULTY[difficulty];
        const puzzle = generate(seed, difficulty);

        // Determinism.
        expect(generate(seed, difficulty)).toEqual(puzzle);

        // Consistent true totals.
        for (let r = 0; r < GRID_SIZE; r += 1) {
          expect(sumRow(puzzle.trueGrid, r)).toBe(puzzle.rowTotals[r]);
        }
        for (let c = 0; c < GRID_SIZE; c += 1) {
          expect(sumCol(puzzle.trueGrid, c)).toBe(puzzle.colTotals[c]);
        }

        // Exactly k altered cells, matching where true and displayed actually differ.
        expect(puzzle.k).toBe(k);
        expect(puzzle.alteredCells).toHaveLength(k);
        expect(new Set(puzzle.alteredCells).size).toBe(k);
        const actuallyDiffering = puzzle.trueGrid
          .map((v, i) => (v !== puzzle.displayedGrid[i] ? i : -1))
          .filter((i) => i >= 0);
        expect(actuallyDiffering.sort((a, b) => a - b)).toEqual([...puzzle.alteredCells].sort((a, b) => a - b));

        // Distinct rows and columns.
        const rows = puzzle.alteredCells.map((i) => Math.floor(i / GRID_SIZE));
        const cols = puzzle.alteredCells.map((i) => i % GRID_SIZE);
        expect(new Set(rows).size).toBe(rows.length);
        expect(new Set(cols).size).toBe(cols.length);

        // Brute-force-verified uniqueness of the altered-cell set (SPEC §2.2).
        const rowDefect = puzzle.rowTotals.map((total, r) => total - sumRow(puzzle.displayedGrid, r));
        const colDefect = puzzle.colTotals.map((total, c) => total - sumCol(puzzle.displayedGrid, c));
        expect(isUniqueAlteration(rowDefect, colDefect, puzzle.k)).toBe(true);
      }
    },
    // Brute-forcing 1,000 seeds is not a fast test. Coverage instrumentation
    // and four cores shared with the rest of the suite put it well past the
    // 30s this used to allow; the work itself is unchanged.
    120_000,
  );

  it("respects the requested difficulty's cell count regardless of seed parity", () => {
    for (let i = 0; i < 50; i += 1) {
      for (const difficulty of DIFFICULTIES) {
        const puzzle = generate(i, difficulty);
        expect(puzzle.k).toBe(K_BY_DIFFICULTY[difficulty]);
      }
    }
  });
});

describe("isUniqueAlteration", () => {
  it("returns true for a textbook unique signature: distinct nonzero defects, one per row/column", () => {
    // Rows 0 and 2 defective (+5, -3); columns 1 and 4 defective (+5, -3);
    // the only consistent pairing is row0<->col1 (both +5), row2<->col4 (both -3).
    const rowDefect = [5, 0, -3, 0, 0];
    const colDefect = [0, 5, 0, 0, -3];
    expect(isUniqueAlteration(rowDefect, colDefect, 2)).toBe(true);
  });

  it("returns false for an ambiguous signature: two equally-valid pairings exist", () => {
    // Rows 0 and 2 both defective by the SAME amount (+5) as columns 1 and 4:
    // row0<->col1 & row2<->col4 is one valid pairing, but row0<->col4 &
    // row2<->col1 is equally consistent (same defect value both ways).
    const rowDefect = [5, 0, 5, 0, 0];
    const colDefect = [0, 5, 0, 0, 5];
    expect(isUniqueAlteration(rowDefect, colDefect, 2)).toBe(false);
  });

  it("returns false when no k-subset can explain the signature at all", () => {
    // A single defective row with no matching defective column: no 1-cell
    // subset can zero out every other row/column while explaining this one.
    const rowDefect = [5, 0, 0, 0, 0];
    const colDefect = [0, 0, 0, 0, 0];
    expect(isUniqueAlteration(rowDefect, colDefect, 1)).toBe(false);
  });

  it("returns true for the trivial all-zero signature with k = 0 cells (vacuous)", () => {
    expect(isUniqueAlteration([0, 0, 0, 0, 0], [0, 0, 0, 0, 0], 0)).toBe(true);
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

  it("never collides with dailySeed's derivation for the same underlying value", () => {
    expect(practiceSeed(0)).not.toBe(dailySeed("2026-09-04"));
  });
});
