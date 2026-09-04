import type { CheckResult, Score } from "@boardatwork/game-core";
import type { ProofPassage } from "./generate";

export const MAX_CHECKS = 5;
export const MAX_HINTS = 3;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface ProofState {
  passage: ProofPassage;
  /** Player-flagged "impostor" words, by index into `passage.words`. */
  flagged: boolean[];
  /** Locked true once a word has been revealed correct by a hint. */
  locked: boolean[];
  checksUsed: number;
  hintsUsed: number;
  done: boolean;
  won: boolean;
  /** One 🟩/🟥 line per check, for the share grid. */
  history: string[];
  message: string;
  log: LogEntry[];
}

export type ProofMove =
  | { type: "toggleFlag"; index: number }
  | { type: "check" }
  | { type: "hint" };

export function init(passage: ProofPassage): ProofState {
  return {
    passage,
    flagged: passage.words.map(() => false),
    locked: passage.words.map(() => false),
    checksUsed: 0,
    hintsUsed: 0,
    done: false,
    won: false,
    history: [],
    message: "Tap the 5 impostor words, then check.",
    log: [
      {
        id: "intro",
        author: "Reviewer",
        text: "Five words in this passage were swapped for real, one-edit-away words. Find all five.",
      },
    ],
  };
}

function flaggedIndices(state: ProofState): number[] {
  return state.flagged.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);
}

function runCheck(state: ProofState): { state: ProofState; result: CheckResult } {
  const impostorSet = new Set(state.passage.impostorIndices);
  const total = state.passage.impostorIndices.length;
  const flagged = flaggedIndices(state);
  const correctFlags = flagged.filter((i) => impostorSet.has(i)).length;
  const wrongFlags = flagged.length - correctFlags;
  const checksUsed = state.checksUsed + 1;
  const won = correctFlags === total && wrongFlags === 0;
  const done = won || checksUsed >= MAX_CHECKS;
  const mismatches = total - correctFlags + wrongFlags;
  const history = [...state.history, won ? "🟩" : "🟥".repeat(Math.min(mismatches, 10))];

  let message: string;
  if (done) {
    message = won ? "Cleared!" : "Out of checks.";
  } else {
    message = `${String(correctFlags)} of ${String(total)} impostors correctly flagged.`;
    if (wrongFlags > 0) {
      message += ` ${String(wrongFlags)} flagged word${wrongFlags === 1 ? " wasn't" : "s weren't"} impostors.`;
    }
  }

  const log = [...state.log, { id: `check-${String(checksUsed)}`, author: "Reviewer", text: message }];

  const result: CheckResult = { correctCount: correctFlags, totalCount: total, done };

  return {
    state: { ...state, checksUsed, done, won, history, message, log },
    result,
  };
}

function runHint(state: ProofState): ProofState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const open = state.passage.impostorIndices.filter((i) => !state.locked[i]);
  if (open.length === 0) {
    return { ...state, message: "Nothing left to hint." };
  }
  const hintsUsed = state.hintsUsed + 1;
  const pick = open[0] as number;
  const word = state.passage.words[pick] ?? "";
  const message = `"${word}" is one of the impostors.`;

  return {
    ...state,
    hintsUsed,
    flagged: state.flagged.map((f, i) => (i === pick ? true : f)),
    locked: state.locked.map((l, i) => (i === pick ? true : l)),
    message,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: message }],
  };
}

export function reduce(state: ProofState, move: ProofMove): ProofState {
  if (state.done) {
    return state;
  }
  switch (move.type) {
    case "toggleFlag": {
      if (state.locked[move.index]) {
        return state;
      }
      return { ...state, flagged: state.flagged.map((f, i) => (i === move.index ? !f : f)) };
    }
    case "check":
      return canCheck(state) ? runCheck(state).state : state;
    case "hint":
      return runHint(state);
  }
}

export function check(state: ProofState): { state: ProofState; result: CheckResult } {
  return runCheck(state);
}

export function hint(state: ProofState): ProofState {
  return runHint(state);
}

export function isDone(state: ProofState): boolean {
  return state.done;
}

export function score(state: ProofState): Score {
  return {
    points: state.won ? MAX_CHECKS - state.checksUsed + 1 : 0,
    maxPoints: MAX_CHECKS,
    checksUsed: state.checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.won,
  };
}

export function canCheck(state: ProofState): boolean {
  return !state.done && state.flagged.some((f) => f);
}
