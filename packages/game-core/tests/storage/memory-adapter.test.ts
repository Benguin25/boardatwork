import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAdapter } from "../../src/storage/memory-adapter";
import { DEFAULT_SETTINGS, type GameResult } from "../../src/storage/types";

function result(dateKey: string, won: boolean): GameResult {
  return {
    game: "braid",
    dateKey,
    difficulty: "medium",
    checksUsed: 2,
    hintsUsed: 0,
    won,
    score: { points: 3, maxPoints: 5, checksUsed: 2, hintsUsed: 0, won },
    moves: [],
    completedAt: `${dateKey}T12:00:00.000Z`,
  };
}

describe("MemoryAdapter", () => {
  let storage: MemoryAdapter;

  beforeEach(() => {
    storage = new MemoryAdapter();
  });

  it("returns undefined for a missing result", async () => {
    await expect(storage.getResult("braid", "2026-09-04")).resolves.toBeUndefined();
  });

  it("saves and retrieves a result by game + date", async () => {
    const r = result("2026-09-04", true);
    await storage.saveResult(r);
    await expect(storage.getResult("braid", "2026-09-04")).resolves.toEqual(r);
    await expect(storage.getResult("audit", "2026-09-04")).resolves.toBeUndefined();
  });

  it("lists results for a game sorted by date", async () => {
    await storage.saveResult(result("2026-09-02", true));
    await storage.saveResult(result("2026-09-01", false));
    const list = await storage.listResults("braid");
    expect(list.map((r) => r.dateKey)).toEqual(["2026-09-01", "2026-09-02"]);
  });

  it("computes stats from saved results", async () => {
    await storage.saveResult(result("2026-09-01", true));
    await storage.saveResult(result("2026-09-02", true));
    const stats = await storage.getStats("braid");
    expect(stats.played).toBe(2);
    expect(stats.currentStreak).toBe(2);
  });

  it("defaults settings and round-trips saved settings", async () => {
    await expect(storage.getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
    await storage.saveSettings({ mode: "work", skin: "docs", nickname: "Zach" });
    await expect(storage.getSettings()).resolves.toEqual({
      mode: "work",
      skin: "docs",
      nickname: "Zach",
    });
  });
});
