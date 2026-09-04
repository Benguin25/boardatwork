import type { CheckResult, Score } from "@boardatwork/game-core";
import type { AuditPuzzle } from "./generate";

export const MAX_CHECKS = 5;
export const MAX_HINTS = 3;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface AuditState {
  puzzle: AuditPuzzle;
  /** Row-major, length 25: which cells the player has flagged as altered. */
  flagged: boolean[];
  /** Row-major, length 25: cells revealed (and locked) by a hint. Always a subset of `flagged`. */
  locked: boolean[];
  checksUsed: number;
  hintsUsed: number;
  done: boolean;
  won: boolean;
  /** One emoji line per check, for the share grid (SPEC §2: no letters/numbers). */
  history: string[];
  message: string;
  log: LogEntry[];
}

export type AuditMove = { type: "toggle"; index: number } | { type: "check" } | { type: "hint" };

export function init(puzzle: AuditPuzzle): AuditState {
  return {
    puzzle,
    flagged: puzzle.displayedGrid.map(() => false),
    locked: puzzle.displayedGrid.map(() => false),
    checksUsed: 0,
    hintsUsed: 0,
    done: false,
    won: false,
    history: [],
    message: `${String(puzzle.k)} cells were altered. Flag them, then check.`,
    log: [
      {
        id: "intro",
        author: "Puzzle",
        text: `${String(puzzle.k)} cells altered. Row and column totals are the originals.`,
      },
    ],
  };
}

function flaggedCount(state: AuditState): number {
  return state.flagged.filter(Boolean).length;
}

/**
 * The puzzle is checkable once exactly `k` cells are flagged (mirrors
 * Braid's "every letter assigned" gate) — the player is told `k` up front,
 * so this is a clean, standard "ready to submit" analog rather than an
 * arbitrary restriction.
 */
export function canCheck(state: AuditState): boolean {
  return !state.done && flaggedCount(state) === state.puzzle.k;
}

function runCheck(state: AuditState): { state: AuditState; result: CheckResult } {
  const { puzzle, flagged } = state;
  const altered = new Set(puzzle.alteredCells);
  let correctCount = 0;
  for (let i = 0; i < flagged.length; i += 1) {
    if (flagged[i] && altered.has(i)) {
      correctCount += 1;
    }
  }

  const checksUsed = state.checksUsed + 1;
  const won = correctCount === puzzle.k;
  const done = won || checksUsed >= MAX_CHECKS;

  // One mark per altered cell: green for each correct flag, black for each
  // miss — shows progress without revealing which specific cells matched.
  const historyLine = `${"🟩".repeat(correctCount)}${"⬛".repeat(puzzle.k - correctCount)}`;
  const history = [...state.history, historyLine];

  const message = won
    ? "Cleared! Every altered cell flagged."
    : done
      ? `Out of checks. ${String(correctCount)}/${String(puzzle.k)} correct on that last check.`
      : `${String(correctCount)}/${String(puzzle.k)} flagged cells correct.`;
  const log = [...state.log, { id: `check-${String(checksUsed)}`, author: "Reviewer", text: message }];

  const result: CheckResult = { correctCount, totalCount: puzzle.k, done };
  return { state: { ...state, checksUsed, done, won, history, message, log }, result };
}

function runHint(state: AuditState): AuditState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const openAltered = state.puzzle.alteredCells.filter((idx) => !state.locked[idx]);
  if (openAltered.length === 0) {
    return { ...state, message: "Nothing left to hint." };
  }

  const hintsUsed = state.hintsUsed + 1;
  const pick = openAltered[0] as number;
  const flagged = state.flagged.map((f, i) => (i === pick ? true : f));
  const locked = state.locked.map((l, i) => (i === pick ? true : l));
  const row = Math.floor(pick / 5) + 1;
  const col = (pick % 5) + 1;
  const message = `Revealed and locked in row ${String(row)}, column ${String(col)}.`;

  return {
    ...state,
    hintsUsed,
    flagged,
    locked,
    message,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: message }],
  };
}

export function reduce(state: AuditState, move: AuditMove): AuditState {
  if (state.done && move.type !== "check") {
    return state;
  }
  switch (move.type) {
    case "toggle": {
      if (state.locked[move.index]) {
        return state;
      }
      const flagged = state.flagged.map((f, i) => (i === move.index ? !f : f));
      return { ...state, flagged };
    }
    case "check":
      return canCheck(state) ? runCheck(state).state : state;
    case "hint":
      return runHint(state);
  }
}

export function check(state: AuditState): { state: AuditState; result: CheckResult } {
  return runCheck(state);
}

export function hint(state: AuditState): AuditState {
  return runHint(state);
}

export function isDone(state: AuditState): boolean {
  return state.done;
}

export function score(state: AuditState): Score {
  return {
    points: state.won ? MAX_CHECKS - state.checksUsed + 1 : 0,
    maxPoints: MAX_CHECKS,
    checksUsed: state.checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.won,
  };
}
