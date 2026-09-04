import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type GameResult } from "@boardatwork/game-core";
import { LocalStorageAdapter } from "./local-adapter";

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

describe("LocalStorageAdapter", () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    storage = new LocalStorageAdapter();
  });

  it("returns undefined for a missing result", async () => {
    await expect(storage.getResult("braid", "2026-09-04")).resolves.toBeUndefined();
  });

  it("saves, overwrites, and retrieves a result by game + date", async () => {
    await storage.saveResult(result("2026-09-04", false));
    await storage.saveResult(result("2026-09-04", true));
    const found = await storage.getResult("braid", "2026-09-04");
    expect(found?.won).toBe(true);
  });

  it("lists results for a game sorted by date", async () => {
    await storage.saveResult(result("2026-09-02", true));
    await storage.saveResult(result("2026-09-01", true));
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

  it("treats missing/corrupt results data as empty rather than crashing", async () => {
    window.localStorage.setItem("boardatwork:v1:results", "not json");
    await expect(storage.listResults("braid")).resolves.toEqual([]);

    window.localStorage.setItem("boardatwork:v1:results", JSON.stringify({ not: "an array" }));
    await expect(storage.listResults("braid")).resolves.toEqual([]);

    window.localStorage.setItem(
      "boardatwork:v1:results",
      JSON.stringify([{ bogus: true }, result("2026-09-01", true)]),
    );
    const list = await storage.listResults("braid");
    expect(list).toHaveLength(1);
  });

  it("defaults settings when unset and round-trips saved settings", async () => {
    await expect(storage.getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
    await storage.saveSettings({ mode: "work", skin: "docs", nickname: "Zach" });
    await expect(storage.getSettings()).resolves.toEqual({
      mode: "work",
      skin: "docs",
      nickname: "Zach",
    });
  });

  it("falls back to default settings on corrupt stored settings", async () => {
    window.localStorage.setItem("boardatwork:v1:settings", "not json");
    await expect(storage.getSettings()).resolves.toEqual(DEFAULT_SETTINGS);

    window.localStorage.setItem("boardatwork:v1:settings", JSON.stringify({ mode: "nope" }));
    await expect(storage.getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
  });
});
