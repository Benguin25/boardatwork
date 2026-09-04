import { z } from "zod";
import { DifficultySchema } from "../schemas";

export const ScoreSchema = z.object({
  points: z.number(),
  maxPoints: z.number(),
  checksUsed: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  won: z.boolean(),
});

/** A completed daily result (SPEC §4.5 `results`). Practice/challenge plays are never saved here. */
export const GameResultSchema = z.object({
  game: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  difficulty: DifficultySchema,
  checksUsed: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  won: z.boolean(),
  score: ScoreSchema,
  moves: z.array(z.unknown()),
  completedAt: z.string().datetime(),
});

export type GameResult = z.infer<typeof GameResultSchema>;

export const GameStatsSchema = z.object({
  game: z.string().min(1),
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  checksDistribution: z.record(z.string(), z.number().int().nonnegative()),
});

export type GameStats = z.infer<typeof GameStatsSchema>;

export const SettingsSchema = z.object({
  mode: z.enum(["play", "work"]),
  skin: z.string().min(1),
  nickname: z.string().min(1).max(40).optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  mode: "play",
  skin: "play",
};

/**
 * Every read/write of persisted game data goes through this interface
 * (CLAUDE.md: "no direct localStorage, fetch, or Supabase calls anywhere
 * except adapters"). All methods are `async` so a network-backed adapter
 * (e.g. Supabase, ADR-0004) is a non-breaking swap for `LocalStorageAdapter`.
 */
export interface Storage {
  getResult(game: string, dateKey: string): Promise<GameResult | undefined>;
  saveResult(result: GameResult): Promise<void>;
  getStats(game: string): Promise<GameStats>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  listResults(game: string): Promise<readonly GameResult[]>;
}
