import { z } from "zod";

/**
 * Whether today's daily has been *started* — the home page's "in progress"
 * state (SPEC §3.1). Deliberately app-side rather than part of the
 * `Storage` interface in `game-core`: it is a presentation hint, never
 * replayed or scored, and `results` stays the single record of a finished
 * play (ADR-0002/ADR-0004).
 */
export const ProgressSchema = z.object({
  game: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  movesPlayed: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

export type Progress = z.infer<typeof ProgressSchema>;

export interface ProgressStore {
  get(game: string, dateKey: string): Promise<Progress | undefined>;
  save(progress: Progress): Promise<void>;
}

const KEY = "boardatwork:v1:progress";

/** In-memory `ProgressStore` for server rendering and tests. */
export class MemoryProgressStore implements ProgressStore {
  private readonly entries = new Map<string, Progress>();

  get(game: string, dateKey: string): Promise<Progress | undefined> {
    return Promise.resolve(this.entries.get(`${game}:${dateKey}`));
  }

  save(progress: Progress): Promise<void> {
    this.entries.set(`${progress.game}:${progress.dateKey}`, progress);
    return Promise.resolve();
  }
}

function readAll(): Progress[] {
  const raw = window.localStorage.getItem(KEY);
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
  const entries: Progress[] = [];
  for (const entry of parsed) {
    const validated = ProgressSchema.safeParse(entry);
    if (validated.success) {
      entries.push(validated.data);
    }
  }
  return entries;
}

/** `ProgressStore` over `window.localStorage`, validating every read with Zod. */
export class LocalProgressStore implements ProgressStore {
  get(game: string, dateKey: string): Promise<Progress | undefined> {
    return Promise.resolve(
      readAll().find((entry) => entry.game === game && entry.dateKey === dateKey),
    );
  }

  save(progress: Progress): Promise<void> {
    const entries = readAll().filter(
      (entry) => !(entry.game === progress.game && entry.dateKey === progress.dateKey),
    );
    entries.push(progress);
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    return Promise.resolve();
  }
}
