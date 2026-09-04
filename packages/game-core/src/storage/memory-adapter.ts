import { computeStats } from "./stats";
import {
  DEFAULT_SETTINGS,
  type GameResult,
  type GameStats,
  type Settings,
  type Storage,
} from "./types";

function resultKey(game: string, dateKey: string): string {
  return `${game}:${dateKey}`;
}

/** In-process `Storage` implementation for tests and server-side throwaway stores. */
export class MemoryAdapter implements Storage {
  private readonly results = new Map<string, GameResult>();
  private settings: Settings = { ...DEFAULT_SETTINGS };

  getResult(game: string, dateKey: string): Promise<GameResult | undefined> {
    return Promise.resolve(this.results.get(resultKey(game, dateKey)));
  }

  saveResult(result: GameResult): Promise<void> {
    this.results.set(resultKey(result.game, result.dateKey), result);
    return Promise.resolve();
  }

  getStats(game: string): Promise<GameStats> {
    return Promise.resolve(computeStats(game, [...this.results.values()]));
  }

  getSettings(): Promise<Settings> {
    return Promise.resolve(this.settings);
  }

  saveSettings(settings: Settings): Promise<void> {
    this.settings = settings;
    return Promise.resolve();
  }

  listResults(game: string): Promise<readonly GameResult[]> {
    const list = [...this.results.values()]
      .filter((result) => result.game === game)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return Promise.resolve(list);
  }
}
