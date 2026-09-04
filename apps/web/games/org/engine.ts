import type { CheckResult, Score } from "@boardatwork/game-core";
import type { OrgPuzzle } from "./generate";

export const MAX_CHECKS = 5;
export const MAX_HINTS = 3;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export type CellMark = "empty" | "yes" | "no";

/** Column index: 0..4 are the role columns, 5..9 the team columns (SPEC §2.6 design note — one `LogicGrid` with rows = people, columns = roles UNION teams). */
const ROLE_COLS = [0, 1, 2, 3, 4];
const TEAM_COLS = [5, 6, 7, 8, 9];
const COL_COUNT = 10;

export interface OrgState {
  puzzle: OrgPuzzle;
  /** `marks[personIdx][colIdx]`. */
  marks: CellMark[][];
  /** Cells locked in by a hint; further `mark` moves on them are a no-op. */
  locked: boolean[][];
  checksUsed: number;
  hintsUsed: number;
  done: boolean;
  won: boolean;
  /** One 🟩/🟨 line per check, for the share grid. */
  history: string[];
  message: string;
  log: LogEntry[];
}

export type OrgMove =
  | { type: "mark"; person: number; col: number }
  | { type: "check" }
  | { type: "hint" };

function colKind(col: number): "role" | "team" {
  return col < 5 ? "role" : "team";
}

function groupCols(col: number): readonly number[] {
  return colKind(col) === "role" ? ROLE_COLS : TEAM_COLS;
}

function cycleMark(current: CellMark): CellMark {
  if (current === "empty") {
    return "yes";
  }
  return current === "yes" ? "no" : "empty";
}

export function init(puzzle: OrgPuzzle): OrgState {
  const n = puzzle.people.length;
  return {
    puzzle,
    marks: Array.from({ length: n }, () => Array.from({ length: COL_COUNT }, (): CellMark => "empty")),
    locked: Array.from({ length: n }, () => Array.from({ length: COL_COUNT }, () => false)),
    checksUsed: 0,
    hintsUsed: 0,
    done: false,
    won: false,
    history: [],
    message: "Mark each person's role and team, then check.",
    log: puzzle.clues.map((clue) => ({ id: clue.id, author: "Policy", text: clue.text })),
  };
}

/** Sets `col` to "yes" for `person` and every other column in its group to "no" (SPEC §2.6 design note: "a yes in one cell implies no for the rest of that person's row within that column-group"). */
function setYes(marks: readonly CellMark[][], person: number, col: number): CellMark[][] {
  return marks.map((row, p) => {
    if (p !== person) {
      return row;
    }
    return row.map((cell, c) => {
      if (!groupCols(col).includes(c)) {
        return cell;
      }
      return c === col ? "yes" : "no";
    });
  });
}

function axisYesIndex(marks: readonly CellMark[][], person: number, cols: readonly number[]): number | undefined {
  return cols.find((c) => marks[person]?.[c] === "yes");
}

function isFull(state: OrgState): boolean {
  return state.puzzle.people.every(
    (_, p) => axisYesIndex(state.marks, p, ROLE_COLS) !== undefined && axisYesIndex(state.marks, p, TEAM_COLS) !== undefined,
  );
}

function axisCorrect(state: OrgState, person: number, kind: "role" | "team"): boolean {
  const cols = kind === "role" ? ROLE_COLS : TEAM_COLS;
  const yesCol = axisYesIndex(state.marks, person, cols);
  if (yesCol === undefined) {
    return false;
  }
  const trueIndex = kind === "role" ? state.puzzle.solution.role[person] : state.puzzle.solution.team[person];
  const markedIndex = kind === "role" ? yesCol : yesCol - 5;
  return markedIndex === trueIndex;
}

function runCheck(state: OrgState): { state: OrgState; result: CheckResult } {
  const checksUsed = state.checksUsed + 1;
  const totalCount = state.puzzle.people.length * 2;
  let correctCount = 0;
  state.puzzle.people.forEach((_, p) => {
    if (axisCorrect(state, p, "role")) {
      correctCount += 1;
    }
    if (axisCorrect(state, p, "team")) {
      correctCount += 1;
    }
  });

  const won = correctCount === totalCount;
  const done = won || checksUsed >= MAX_CHECKS;
  const history = [...state.history, won ? "🟩" : "🟨".repeat(totalCount - correctCount)];

  const message = won
    ? "Cleared!"
    : done
      ? "Out of checks."
      : `${String(correctCount)}/${String(totalCount)} correct.`;
  const log = [...state.log, { id: `check-${String(checksUsed)}`, author: "Reviewer", text: message }];

  const result: CheckResult = { correctCount, totalCount, done };
  return { state: { ...state, checksUsed, done, won, history, message, log }, result };
}

/** First person/axis whose marks aren't yet correct, in a stable (person, then role-before-team) order. */
function firstIncompleteAxis(state: OrgState): { person: number; kind: "role" | "team" } | undefined {
  for (let p = 0; p < state.puzzle.people.length; p += 1) {
    if (!axisCorrect(state, p, "role")) {
      return { person: p, kind: "role" };
    }
    if (!axisCorrect(state, p, "team")) {
      return { person: p, kind: "team" };
    }
  }
  return undefined;
}

function runHint(state: OrgState): OrgState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const target = firstIncompleteAxis(state);
  if (!target) {
    return { ...state, message: "Nothing left to hint." };
  }
  const hintsUsed = state.hintsUsed + 1;
  const { person, kind } = target;
  const trueIndex = kind === "role" ? state.puzzle.solution.role[person] : state.puzzle.solution.team[person];
  const col = kind === "role" ? (trueIndex as number) : (trueIndex as number) + 5;
  const marks = setYes(state.marks, person, col);
  const locked = state.locked.map((row, p) =>
    p === person ? row.map((cell, c) => (groupCols(col).includes(c) ? true : cell)) : row,
  );
  const personName = state.puzzle.people[person];
  const message = `Filled in ${String(personName)}'s ${kind}.`;
  return {
    ...state,
    marks,
    locked,
    hintsUsed,
    message,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: message }],
  };
}

export function reduce(state: OrgState, move: OrgMove): OrgState {
  if (state.done && move.type !== "check") {
    return state;
  }
  switch (move.type) {
    case "mark": {
      if (state.locked[move.person]?.[move.col]) {
        return state;
      }
      const current = state.marks[move.person]?.[move.col] ?? "empty";
      const next = cycleMark(current);
      const marks = next === "yes" ? setYes(state.marks, move.person, move.col) : state.marks.map((row, p) => (p === move.person ? row.map((cell, c) => (c === move.col ? next : cell)) : row));
      return { ...state, marks };
    }
    case "check":
      return isFull(state) && !state.done ? runCheck(state).state : state;
    case "hint":
      return runHint(state);
  }
}

export function check(state: OrgState): { state: OrgState; result: CheckResult } {
  return runCheck(state);
}

export function hint(state: OrgState): OrgState {
  return runHint(state);
}

export function isDone(state: OrgState): boolean {
  return state.done;
}

export function score(state: OrgState): Score {
  return {
    points: state.won ? MAX_CHECKS - state.checksUsed + 1 : 0,
    maxPoints: MAX_CHECKS,
    checksUsed: state.checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.won,
  };
}

export function canCheck(state: OrgState): boolean {
  return isFull(state) && !state.done;
}
