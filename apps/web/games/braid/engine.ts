import type { CheckResult, Score } from "@boardatwork/game-core";
import type { BraidPuzzle } from "./generate";

export const MAX_CHECKS = 5;
export const MAX_HINTS = 3;
export const THEME_AT_CHECK = 2;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface BraidState {
  puzzle: BraidPuzzle;
  /** Strand index (0..words.length-1) each letter is assigned to, or -1 if unassigned. */
  assign: number[];
  locked: boolean[];
  /** Indices flagged wrong by the most recent check, cleared on the next move. */
  wrongIds: number[];
  checksUsed: number;
  hintsUsed: number;
  themeRevealed: boolean;
  done: boolean;
  won: boolean;
  /** One 🟩/🟥 line per check, for the share grid. */
  history: string[];
  message: string;
  log: LogEntry[];
}

export type BraidMove =
  | { type: "assign"; index: number }
  | { type: "clear" }
  | { type: "check" }
  | { type: "hint" };

function cycleStrands(current: number, wordCount: number): number {
  return ((current + 2) % (wordCount + 1)) - 1;
}

export function init(puzzle: BraidPuzzle): BraidState {
  const lens = puzzle.words.map((w) => String(w.length)).join(" and ");
  return {
    puzzle,
    assign: puzzle.letters.map(() => -1),
    locked: puzzle.letters.map(() => false),
    wrongIds: [],
    checksUsed: 0,
    hintsUsed: 0,
    themeRevealed: false,
    done: false,
    won: false,
    history: [],
    message: "Assign every letter, then check.",
    log: [
      { id: "lens", author: "Puzzle", text: `${lens} letters.` },
      { id: "theme", author: "Puzzle", text: `Theme revealed after check ${String(THEME_AT_CHECK)}.` },
    ],
  };
}

function isFull(state: BraidState): boolean {
  const { puzzle, assign } = state;
  if (assign.some((a) => a < 0)) {
    return false;
  }
  const counts = puzzle.words.map((_, k) => assign.filter((a) => a === k).length);
  return counts.every((count, k) => count === puzzle.words[k]?.length);
}

/** Every permutation of `[0..n)`, used to find the strand-label assignment that best matches the true words (colour-permutation-aware check, SPEC §2.1). */
function permutations(n: number): number[][] {
  if (n === 1) {
    return [[0]];
  }
  const smaller = permutations(n - 1);
  const out: number[][] = [];
  for (const perm of smaller) {
    for (let i = 0; i <= perm.length; i += 1) {
      out.push([...perm.slice(0, i), n - 1, ...perm.slice(i)]);
    }
  }
  return out;
}

function bestPermutation(state: BraidState): number[] {
  const { puzzle, assign } = state;
  let best = permutations(puzzle.words.length)[0] as number[];
  let bestHits = -1;
  for (const perm of permutations(puzzle.words.length)) {
    let hits = 0;
    for (let i = 0; i < puzzle.letters.length; i += 1) {
      const a = assign[i] as number;
      if (a >= 0 && perm[a] === puzzle.letters[i]?.src) {
        hits += 1;
      }
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = perm;
    }
  }
  return best;
}

function runCheck(state: BraidState): { state: BraidState; result: CheckResult } {
  const perm = bestPermutation(state);
  const remapped = state.assign.map((a) => (a >= 0 ? (perm[a] as number) : -1));
  const wrongIdx = state.puzzle.letters
    .map((letter, i) => (remapped[i] === letter.src ? -1 : i))
    .filter((i) => i >= 0);
  const checksUsed = state.checksUsed + 1;
  const won = wrongIdx.length === 0;
  const done = won || checksUsed >= MAX_CHECKS;
  const history = [...state.history, won ? "🟩" : "🟥".repeat(Math.min(wrongIdx.length, 10))];

  let locked = state.locked;
  let assign = remapped;
  let wrongIds: number[] = [];
  let message: string;
  const log = [...state.log];

  if (done) {
    message = won ? "Cleared!" : "Out of checks.";
    log.push({ id: `check-${String(checksUsed)}`, author: "Reviewer", text: message });
  } else {
    const pin = wrongIdx[Math.floor(wrongIdx.length / 2)] as number;
    locked = state.locked.map((l, i) => (i === pin ? true : l));
    assign = remapped.map((a, i) => (i === pin ? (state.puzzle.letters[pin]?.src as number) : a));
    wrongIds = wrongIdx.filter((i) => i !== pin);
    message = `${String(wrongIdx.length)} letter${wrongIdx.length === 1 ? " is" : "s are"} on the wrong strand. One locked in.`;
    if (checksUsed === THEME_AT_CHECK) {
      message += " Theme revealed.";
    }
    log.push({ id: `check-${String(checksUsed)}`, author: "Reviewer", text: message });
  }

  const themeRevealed = state.themeRevealed || checksUsed >= THEME_AT_CHECK || done;

  const result: CheckResult = {
    correctCount: state.puzzle.letters.length - wrongIdx.length,
    totalCount: state.puzzle.letters.length,
    done,
  };

  return {
    state: { ...state, assign, locked, wrongIds, checksUsed, done, won, history, message, log, themeRevealed },
    result,
  };
}

function runHint(state: BraidState): BraidState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const hintsUsed = state.hintsUsed + 1;

  if (!state.themeRevealed && state.checksUsed < THEME_AT_CHECK) {
    return {
      ...state,
      hintsUsed,
      themeRevealed: true,
      message: "Theme revealed.",
      log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: "Theme revealed." }],
    };
  }

  const open = state.locked.map((locked, i) => (locked ? -1 : i)).filter((i) => i >= 0);
  if (open.length <= 1) {
    return { ...state, message: "Nothing left to hint." };
  }
  const mid = state.puzzle.letters.length / 2;
  const sorted = [...open].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  const pick = sorted[(hintsUsed - 1) % sorted.length] as number;
  const letter = state.puzzle.letters[pick];
  const ch = letter?.ch ?? "";

  return {
    ...state,
    hintsUsed,
    assign: state.assign.map((a, i) => (i === pick ? (letter?.src as number) : a)),
    locked: state.locked.map((l, i) => (i === pick ? true : l)),
    wrongIds: [],
    message: `Locked in the ${ch}.`,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: `Locked in the ${ch}.` }],
  };
}

export function reduce(state: BraidState, move: BraidMove): BraidState {
  if (state.done && move.type !== "check") {
    return state;
  }
  switch (move.type) {
    case "assign": {
      if (state.locked[move.index]) {
        return state;
      }
      const wordCount = state.puzzle.words.length;
      const current = state.assign[move.index] as number;
      const assign = state.assign.map((a, i) => (i === move.index ? cycleStrands(current, wordCount) : a));
      return { ...state, assign, wrongIds: [] };
    }
    case "clear":
      return {
        ...state,
        assign: state.assign.map((a, i) => (state.locked[i] ? a : -1)),
        wrongIds: [],
      };
    case "check":
      return isFull(state) && !state.done ? runCheck(state).state : state;
    case "hint":
      return runHint(state);
  }
}

export function check(state: BraidState): { state: BraidState; result: CheckResult } {
  return runCheck(state);
}

export function hint(state: BraidState): BraidState {
  return runHint(state);
}

export function isDone(state: BraidState): boolean {
  return state.done;
}

export function score(state: BraidState): Score {
  return {
    points: state.won ? MAX_CHECKS - state.checksUsed + 1 : 0,
    maxPoints: MAX_CHECKS,
    checksUsed: state.checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.won,
  };
}

export function canCheck(state: BraidState): boolean {
  return isFull(state) && !state.done;
}
