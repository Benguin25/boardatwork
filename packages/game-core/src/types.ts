export type Difficulty = "easy" | "medium" | "hard";

export interface CheckResult {
  /** How many of the player's current answers/flags are correct. */
  correctCount: number;
  /** Total answerable units in the puzzle (e.g. flagged words, grid cells). */
  totalCount: number;
  /** True once the puzzle is fully solved by this check. */
  done: boolean;
}

export interface Score {
  points: number;
  maxPoints: number;
  checksUsed: number;
  hintsUsed: number;
  won: boolean;
}

export interface GameMeta {
  name: string;
  tagline: string;
  checks: number;
  hints: number;
}

export type GameId =
  | "braid"
  | "audit"
  | "proof"
  | "forecast"
  | "org"
  | "policy";

/**
 * Pure game engine per SPEC §4.3: `generate`/`init`/`reduce`/`check`/`hint`
 * are pure functions of their inputs (no React, no DOM, no I/O — see
 * ADR-0002), so a server can later verify a result by replaying the move
 * log against the same seed. `render` is deliberately **not** part of this
 * interface — it needs React and `SkinPrimitives` (ADR-0003), so it lives
 * on the `GameModule` type in `apps/web/games/registry.ts`, layered on top
 * of this pure `Game`.
 */
export interface Game<P, S, M> {
  id: GameId;
  meta: GameMeta;
  generate(seed: number, difficulty: Difficulty): P;
  init(puzzle: P): S;
  reduce(state: S, move: M): S;
  check(state: S): { state: S; result: CheckResult };
  hint(state: S): S;
  isDone(state: S): boolean;
  score(state: S): Score;
  shareGrid(state: S): string;
}
