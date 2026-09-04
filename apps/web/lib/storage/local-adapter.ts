import {
  DEFAULT_SETTINGS,
  GameResultSchema,
  GameStatsSchema,
  SettingsSchema,
  computeStats,
  type GameResult,
  type GameStats,
  type Settings,
  type Storage,
} from "@boardatwork/game-core";

const PREFIX = "boardatwork:v1:";
const RESULTS_KEY = `${PREFIX}results`;
const SETTINGS_KEY = `${PREFIX}settings`;

function readResults(): GameResult[] {
  const raw = window.localStorage.getItem(RESULTS_KEY);
  if (raw === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const results: GameResult[] = [];
  for (const entry of parsed) {
    const validated = GameResultSchema.safeParse(entry);
    if (validated.success) {
      results.push(validated.data);
    }
  }
  return results;
}

function writeResults(results: readonly GameResult[]): void {
  window.localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

/**
 * `Storage` backed by `window.localStorage` (ADR-0004). Validates every
 * read with Zod so a corrupt or stale-shape value never crashes the app —
 * it's silently dropped instead (CLAUDE.md: "validate at boundaries...
 * trust nothing from outside the engine").
 */
export class LocalStorageAdapter implements Storage {
  getResult(game: string, dateKey: string): Promise<GameResult | undefined> {
    const results = readResults();
    return Promise.resolve(
      results.find((r) => r.game === game && r.dateKey === dateKey),
    );
  }

  saveResult(result: GameResult): Promise<void> {
    const results = readResults().filter(
      (r) => !(r.game === result.game && r.dateKey === result.dateKey),
    );
    results.push(result);
    writeResults(results);
    return Promise.resolve();
  }

  getStats(game: string): Promise<GameStats> {
    const stats = computeStats(game, readResults());
    return Promise.resolve(GameStatsSchema.parse(stats));
  }

  getSettings(): Promise<Settings> {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw === null) {
      return Promise.resolve(DEFAULT_SETTINGS);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return Promise.resolve(DEFAULT_SETTINGS);
    }
    const validated = SettingsSchema.safeParse(parsed);
    return Promise.resolve(validated.success ? validated.data : DEFAULT_SETTINGS);
  }

  saveSettings(settings: Settings): Promise<void> {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return Promise.resolve();
  }

  listResults(game: string): Promise<readonly GameResult[]> {
    const results = readResults()
      .filter((r) => r.game === game)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return Promise.resolve(results);
  }
}
