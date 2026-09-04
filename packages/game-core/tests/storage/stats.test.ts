import { describe, expect, it } from "vitest";
import { computeStats } from "../../src/storage/stats";
import type { GameResult } from "../../src/storage/types";

function result(overrides: Partial<GameResult> & Pick<GameResult, "dateKey" | "won">): GameResult {
  return {
    game: "braid",
    difficulty: "medium",
    checksUsed: 1,
    hintsUsed: 0,
    score: { points: 1, maxPoints: 1, checksUsed: 1, hintsUsed: 0, won: overrides.won },
    moves: [],
    completedAt: `${overrides.dateKey}T12:00:00.000Z`,
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns zeros for no results", () => {
    expect(computeStats("braid", [])).toEqual({
      game: "braid",
      played: 0,
      won: 0,
      currentStreak: 0,
      bestStreak: 0,
      checksDistribution: {},
    });
  });

  it("only counts results for the requested game", () => {
    const stats = computeStats("braid", [
      result({ dateKey: "2026-09-01", won: true, game: "braid" }),
      result({ dateKey: "2026-09-01", won: true, game: "audit" }),
    ]);
    expect(stats.played).toBe(1);
  });

  it("builds a consecutive-day win streak and breaks on a gap", () => {
    const stats = computeStats("braid", [
      result({ dateKey: "2026-09-01", won: true, checksUsed: 1 }),
      result({ dateKey: "2026-09-02", won: true, checksUsed: 2 }),
      result({ dateKey: "2026-09-04", won: true, checksUsed: 1 }), // gap: skips 09-03
    ]);
    expect(stats.played).toBe(3);
    expect(stats.won).toBe(3);
    expect(stats.bestStreak).toBe(2);
    expect(stats.currentStreak).toBe(1);
    expect(stats.checksDistribution).toEqual({ "1": 2, "2": 1 });
  });

  it("a loss resets the current streak but keeps the best streak", () => {
    const stats = computeStats("braid", [
      result({ dateKey: "2026-09-01", won: true }),
      result({ dateKey: "2026-09-02", won: true }),
      result({ dateKey: "2026-09-03", won: false }),
      result({ dateKey: "2026-09-04", won: true }),
    ]);
    expect(stats.bestStreak).toBe(2);
    expect(stats.currentStreak).toBe(1);
  });

  it("sorts out-of-order input by date before computing streaks", () => {
    const stats = computeStats("braid", [
      result({ dateKey: "2026-09-02", won: true }),
      result({ dateKey: "2026-09-01", won: true }),
    ]);
    expect(stats.bestStreak).toBe(2);
    expect(stats.currentStreak).toBe(2);
  });
});
