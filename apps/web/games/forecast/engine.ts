import type { CheckResult, Score } from "@boardatwork/game-core";
import type { ForecastPuzzle } from "./generate";
import { QUESTION_COUNT } from "./generate";
import type { ForecastQuestion } from "@/lib/content/forecast-schema";

/**
 * SPEC §2.4: "No checks; one submission per question. Hint narrows the
 * range by 50%." Forecast has no "checks" concept at all (there's nothing
 * to re-check — a question is answered once and locked in), so
 * `meta.checks` is 0. The 3-hint budget is the SPEC's shared per-puzzle
 * default (§2: "Hints: 3 per puzzle") applied literally: ONE pool of 3
 * hints spent across all 5 questions, not 3 hints per question.
 */
export const MAX_HINTS = 3;
export const POINTS_PER_QUESTION = 3;
export const MAX_POINTS = QUESTION_COUNT * POINTS_PER_QUESTION;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface ForecastQuestionResult {
  /** The value the player had dialled in when they submitted. */
  value: number;
  /** Relative error (or absolute error, if the true answer is 0) — see `bandFor`. */
  error: number;
  /** Log-error band points for this question: 3 / 2 / 1 / 0. */
  points: number;
}

export interface ForecastState {
  puzzle: ForecastPuzzle;
  /** Index of the question currently being answered; `QUESTION_COUNT` once `done`. */
  index: number;
  /** Current slider position for the question at `index`. */
  value: number;
  /** Current (possibly hint-narrowed) slider bounds for the question at `index`. */
  min: number;
  max: number;
  hintsUsed: number;
  /** One entry per question, in order; `undefined` until that question is submitted. */
  results: readonly (ForecastQuestionResult | undefined)[];
  done: boolean;
  message: string;
  log: LogEntry[];
}

export type ForecastMove =
  | { type: "setValue"; value: number }
  | { type: "hint" }
  | { type: "submit" };

function midpoint(min: number, max: number): number {
  return Math.round((min + max) / 2);
}

function currentQuestion(state: ForecastState): ForecastQuestion | undefined {
  return state.puzzle.questions[state.index];
}

export function init(puzzle: ForecastPuzzle): ForecastState {
  const first = puzzle.questions[0];
  if (!first) {
    throw new Error("Forecast puzzle must have at least one question");
  }
  return {
    puzzle,
    index: 0,
    value: midpoint(first.min, first.max),
    min: first.min,
    max: first.max,
    hintsUsed: 0,
    results: puzzle.questions.map(() => undefined),
    done: false,
    message: "Drag to your best estimate, then submit.",
    log: [
      {
        id: "start",
        author: "Puzzle",
        text: `${String(puzzle.questions.length)} questions. ${String(MAX_HINTS)} hints shared across all of them.`,
      },
    ],
  };
}

/**
 * Log-error banding (SPEC §2.4, exact): relative error `|guess - answer| /
 * answer`, banded at <=5% -> 3pts, <=15% -> 2pts, <=40% -> 1pt, else 0. A
 * true answer of 0 would make relative error undefined, so that case falls
 * back to absolute error — the content pack is authored to avoid a 0
 * answer entirely, but the engine stays correct either way.
 */
function bandFor(answer: number, guess: number): { error: number; points: number } {
  const error = answer === 0 ? Math.abs(guess - answer) : Math.abs(guess - answer) / Math.abs(answer);
  const points = error <= 0.05 ? 3 : error <= 0.15 ? 2 : error <= 0.4 ? 1 : 0;
  return { error, points };
}

function messageFor(points: number): string {
  if (points === 3) return "Within 5%! +3";
  if (points === 2) return "Within 15%! +2";
  if (points === 1) return "Within 40%! +1";
  return "Off by a lot. +0";
}

function runSetValue(state: ForecastState, value: number): ForecastState {
  const clamped = Math.min(Math.max(value, state.min), state.max);
  if (clamped === state.value) {
    return state;
  }
  return { ...state, value: clamped };
}

/**
 * Narrows the current question's slider range by 50%, centered on the
 * true answer (so the true value always stays reachable), clamped back
 * inside the question's original `[min, max]` so a hint never *widens*
 * the range. No-op once the range is already too small to meaningfully
 * narrow further (width <= 1, i.e. at most two distinct integer values
 * remain), once hints are exhausted, or once the puzzle is done.
 */
function runHint(state: ForecastState): ForecastState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const question = currentQuestion(state);
  if (!question) {
    return state;
  }
  const width = state.max - state.min;
  if (width <= 1) {
    return { ...state, message: "Nothing left to narrow on this one." };
  }
  const newWidth = width / 2;
  const target = question.answer;
  const newMin = Math.max(question.min, target - newWidth / 2);
  const newMax = Math.min(question.max, target + newWidth / 2);
  const hintsUsed = state.hintsUsed + 1;
  const value = Math.min(Math.max(state.value, newMin), newMax);
  const left = MAX_HINTS - hintsUsed;
  const message = `Range narrowed. ${String(left)} hint${left === 1 ? "" : "s"} left.`;
  return {
    ...state,
    hintsUsed,
    min: newMin,
    max: newMax,
    value,
    message,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Puzzle", text: message }],
  };
}

/** Only ever called from `reduce`, which already guards `state.done` — see the comment there. */
function runSubmit(state: ForecastState): ForecastState {
  const question = currentQuestion(state);
  if (!question) {
    return state;
  }
  const { error, points } = bandFor(question.answer, state.value);
  const result: ForecastQuestionResult = { value: state.value, error, points };
  const results = state.results.map((r, i) => (i === state.index ? result : r));
  const bandMessage = messageFor(points);
  const log = [
    ...state.log,
    {
      id: `submit-${String(state.index)}`,
      author: "Reviewer",
      text: `Q${String(state.index + 1)}: guessed ${String(state.value)}${question.unit}, actual ${String(question.answer)}${question.unit}. ${bandMessage}`,
    },
  ];

  const nextIndex = state.index + 1;
  const done = nextIndex >= state.puzzle.questions.length;

  if (done) {
    const total = results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
    const finalMessage = `Forecast complete! ${String(total)}/${String(MAX_POINTS)} points.`;
    return {
      ...state,
      results,
      index: nextIndex,
      done: true,
      message: finalMessage,
      log: [...log, { id: "final", author: "Puzzle", text: finalMessage }],
    };
  }

  const next = state.puzzle.questions[nextIndex] as ForecastQuestion;
  return {
    ...state,
    results,
    index: nextIndex,
    min: next.min,
    max: next.max,
    value: midpoint(next.min, next.max),
    message: bandMessage,
    log,
  };
}

export function reduce(state: ForecastState, move: ForecastMove): ForecastState {
  if (state.done) {
    return state;
  }
  switch (move.type) {
    case "setValue":
      return runSetValue(state, move.value);
    case "hint":
      return runHint(state);
    case "submit":
      return runSubmit(state);
  }
}

/**
 * Forecast has no "check" interaction (SPEC §2.4: one submission per
 * question, no re-checking), so this exists only to satisfy `GameModule`
 * for a hypothetical server-side score-verification pass. It's a pure
 * read of current state — no transition, no move to replay.
 */
export function check(state: ForecastState): { state: ForecastState; result: CheckResult } {
  const total = state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
  return { state, result: { correctCount: total, totalCount: MAX_POINTS, done: isDone(state) } };
}

export function hint(state: ForecastState): ForecastState {
  return runHint(state);
}

export function isDone(state: ForecastState): boolean {
  return state.done;
}

/**
 * Forecast has no binary win/lose condition (SPEC §2.4 describes a points
 * total, not a pass/fail check budget), so `won` is simply "the player
 * answered all 5 questions" — i.e. it mirrors `done`. This keeps `Score`
 * meaningful for leaderboards (which sort on `points`) without inventing
 * an arbitrary points threshold the SPEC never specifies.
 */
export function score(state: ForecastState): Score {
  const points = state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
  return {
    points,
    maxPoints: MAX_POINTS,
    checksUsed: 0,
    hintsUsed: state.hintsUsed,
    won: state.done,
  };
}
