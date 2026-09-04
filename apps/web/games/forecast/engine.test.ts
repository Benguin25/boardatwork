import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { ForecastState } from "./engine";
import type { ForecastPuzzle } from "./generate";
import type { ForecastQuestion } from "@/lib/content/forecast-schema";

/**
 * A hand-built 5-question puzzle with round numbers, used by every test
 * below for precise, easy-to-verify error/band math (unlike a real
 * generated puzzle, whose questions and ranges vary by seed).
 */
function fixturePuzzle(): ForecastPuzzle {
  const questions: ForecastQuestion[] = [
    { id: "q1", question: "Q1?", answer: 100, unit: "u", sourceUrl: "https://example.com/1", min: 0, max: 200, difficulty: "easy" },
    { id: "q2", question: "Q2?", answer: 50, unit: "u", sourceUrl: "https://example.com/2", min: 0, max: 100, difficulty: "medium" },
    { id: "q3", question: "Q3?", answer: 10, unit: "u", sourceUrl: "https://example.com/3", min: 0, max: 20, difficulty: "hard" },
    { id: "q4", question: "Q4?", answer: 1000, unit: "u", sourceUrl: "https://example.com/4", min: 0, max: 2000, difficulty: "easy" },
    { id: "q5", question: "Q5?", answer: 5, unit: "u", sourceUrl: "https://example.com/5", min: 0, max: 10, difficulty: "medium" },
  ];
  return { seed: 0, difficulty: "medium", questions };
}

function submitValue(state: ForecastState, value: number): ForecastState {
  let next = engine.reduce(state, { type: "setValue", value });
  next = engine.reduce(next, { type: "submit" });
  return next;
}

describe("init", () => {
  it("starts on question 1, slider at the midpoint of its range, nothing submitted", () => {
    const state = engine.init(fixturePuzzle());
    expect(state.index).toBe(0);
    expect(state.min).toBe(0);
    expect(state.max).toBe(200);
    expect(state.value).toBe(100); // midpoint(0, 200)
    expect(state.hintsUsed).toBe(0);
    expect(state.done).toBe(false);
    expect(state.results).toEqual([undefined, undefined, undefined, undefined, undefined]);
    expect(state.log).toHaveLength(1);
  });

  it("throws if handed a puzzle with no questions (defensive — generate() never produces one)", () => {
    const empty: ForecastPuzzle = { ...fixturePuzzle(), questions: [] };
    expect(() => engine.init(empty)).toThrow("Forecast puzzle must have at least one question");
  });
});

describe("reduce: setValue", () => {
  it("updates the slider value within range", () => {
    const state = engine.init(fixturePuzzle());
    const next = engine.reduce(state, { type: "setValue", value: 42 });
    expect(next.value).toBe(42);
  });

  it("clamps below min up to min", () => {
    const state = engine.init(fixturePuzzle());
    const next = engine.reduce(state, { type: "setValue", value: -50 });
    expect(next.value).toBe(0);
  });

  it("clamps above max down to max", () => {
    const state = engine.init(fixturePuzzle());
    const next = engine.reduce(state, { type: "setValue", value: 999 });
    expect(next.value).toBe(200);
  });

  it("is a no-op (same reference) when the clamped value doesn't change", () => {
    const state = engine.init(fixturePuzzle()); // value already 100
    const next = engine.reduce(state, { type: "setValue", value: 100 });
    expect(next).toBe(state);
  });
});

describe("reduce: submit — log-error bands", () => {
  it("awards 3 points at exactly 5% error (boundary, inclusive)", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 105); // |105-100|/100 = 0.05
    expect(state.results[0]?.error).toBeCloseTo(0.05);
    expect(state.results[0]?.points).toBe(3);
    expect(state.message).toBe("Within 5%! +3");
  });

  it("awards 2 points just outside the 5% band", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 105.5); // error 0.055
    expect(state.results[0]?.points).toBe(2);
    expect(state.message).toBe("Within 15%! +2");
  });

  it("awards 2 points at exactly 15% error (boundary, inclusive)", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 115); // error 0.15
    expect(state.results[0]?.error).toBeCloseTo(0.15);
    expect(state.results[0]?.points).toBe(2);
  });

  it("awards 1 point just outside the 15% band", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 115.5); // error 0.155
    expect(state.results[0]?.points).toBe(1);
    expect(state.message).toBe("Within 40%! +1");
  });

  it("awards 1 point at exactly 40% error (boundary, inclusive)", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 140); // error 0.40
    expect(state.results[0]?.error).toBeCloseTo(0.4);
    expect(state.results[0]?.points).toBe(1);
  });

  it("awards 0 points just outside the 40% band", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 140.5); // error 0.405
    expect(state.results[0]?.points).toBe(0);
    expect(state.message).toBe("Off by a lot. +0");
  });

  it("awards 3 points for a perfect guess", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 100);
    expect(state.results[0]?.error).toBe(0);
    expect(state.results[0]?.points).toBe(3);
    expect(state.message).toBe("Within 5%! +3");
  });

  it("falls back to absolute-error banding when the true answer is 0", () => {
    const puzzle = fixturePuzzle();
    const zeroQuestion: ForecastQuestion = { ...puzzle.questions[0]!, answer: 0, min: -10, max: 10 };
    const zeroPuzzle: ForecastPuzzle = { ...puzzle, questions: [zeroQuestion, ...puzzle.questions.slice(1)] };
    const state = submitValue(engine.init(zeroPuzzle), 0.03); // absolute error 0.03 <= 0.05
    expect(state.results[0]?.error).toBeCloseTo(0.03);
    expect(state.results[0]?.points).toBe(3);
  });
});

describe("reduce: submit — question progression", () => {
  it("advances to the next question, resetting its slider to its own midpoint and range", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 100);
    expect(state.index).toBe(1);
    expect(state.min).toBe(0);
    expect(state.max).toBe(100);
    expect(state.value).toBe(50); // midpoint(0, 100)
    expect(state.done).toBe(false);
  });

  it("records a log entry per submission without revealing it prematurely", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 100);
    expect(state.log.some((e) => e.text.includes("Q1"))).toBe(true);
  });

  it("marks done and produces a final summary after the 5th submission", () => {
    let state = engine.init(fixturePuzzle());
    const guesses = [100, 50, 10, 1000, 5]; // perfect guesses -> 15/15
    for (const guess of guesses) {
      state = submitValue(state, guess);
    }
    expect(state.done).toBe(true);
    expect(state.index).toBe(5);
    expect(state.results.every((r) => r?.points === 3)).toBe(true);
    expect(state.message).toBe("Forecast complete! 15/15 points.");
  });

  it("scores a mixed puzzle correctly (partial credit across questions)", () => {
    let state = engine.init(fixturePuzzle());
    // q1 perfect (3), q2 way off (0), q3 within 15% (2), q4 within 40% (1), q5 perfect (3)
    state = submitValue(state, 100);
    state = submitValue(state, 5000);
    state = submitValue(state, 11); // |11-10|/10 = 0.10 -> 2pts
    state = submitValue(state, 1350); // |1350-1000|/1000 = 0.35 -> 1pt
    state = submitValue(state, 5);
    const totalPoints = state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
    expect(totalPoints).toBe(9);
    expect(state.done).toBe(true);
  });
});

describe("reduce: hint", () => {
  it("narrows the current question's range by 50%, centred on the true answer", () => {
    const state = engine.reduce(engine.init(fixturePuzzle()), { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.min).toBe(50); // 100 - (200/2)/2
    expect(state.max).toBe(150); // 100 + (200/2)/2
    expect(state.message).toBe("Range narrowed. 2 hints left.");
  });

  it("clamps the current slider value into the newly narrowed range", () => {
    let state = engine.reduce(engine.init(fixturePuzzle()), { type: "setValue", value: 10 });
    state = engine.reduce(state, { type: "hint" }); // range becomes [50, 150]
    expect(state.value).toBe(50);
  });

  it("keeps narrowing on repeated hints, clamped inside the original bounds", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" }); // [50, 150]
    state = engine.reduce(state, { type: "hint" }); // width 100 -> 50, centred on 100 -> [75, 125]
    expect(state.min).toBe(75);
    expect(state.max).toBe(125);
    expect(state.hintsUsed).toBe(2);
  });

  it("stops granting hints once the shared pool of 3 is exhausted", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(engine.MAX_HINTS);
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("does nothing (without spending a hint) once the range is too narrow to usefully halve", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, min: 99.6, max: 100.4 }; // width 0.8 <= 1
    const next = engine.reduce(state, { type: "hint" });
    expect(next.hintsUsed).toBe(0);
    expect(next.message).toBe("Nothing left to narrow on this one.");
  });

  it("the shared pool carries across questions (a hint on Q2 still spends from the same 3)", () => {
    let state = submitValue(engine.init(fixturePuzzle()), 100); // -> Q2
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.min).toBe(25); // Q2: answer 50, range [0,100] -> [25,75]
    expect(state.max).toBe(75);
  });

  it("does nothing once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("the standalone hint() matches reduce's hint move", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("reduce: ignores moves once done, and guards a missing current question", () => {
  it("setValue is a no-op once done", () => {
    let state = engine.init(fixturePuzzle());
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const next = engine.reduce(state, { type: "setValue", value: 1 });
    expect(next).toBe(state);
  });

  it("submit is a no-op once done", () => {
    let state = engine.init(fixturePuzzle());
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const next = engine.reduce(state, { type: "submit" });
    expect(next).toBe(state);
  });

  it("hint/submit no-op if state.index has run past the last question (defensive)", () => {
    const state: ForecastState = { ...engine.init(fixturePuzzle()), index: 5, done: false };
    expect(engine.reduce(state, { type: "hint" })).toBe(state);
    expect(engine.reduce(state, { type: "submit" })).toBe(state);
  });
});

describe("check/isDone/score", () => {
  it("check() is a pure read that doesn't mutate state, mid-puzzle", () => {
    const state = submitValue(engine.init(fixturePuzzle()), 100); // 3 points so far
    const { state: returned, result } = engine.check(state);
    expect(returned).toBe(state);
    expect(result).toEqual({ correctCount: 3, totalCount: engine.MAX_POINTS, done: false });
  });

  it("check() reflects the final total once done", () => {
    let state = engine.init(fixturePuzzle());
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const { result } = engine.check(state);
    expect(result).toEqual({ correctCount: 15, totalCount: 15, done: true });
  });

  it("isDone mirrors state.done", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score sums per-question points and reports won once the puzzle is complete", () => {
    let state = engine.init(fixturePuzzle());
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const s = engine.score(state);
    expect(s).toEqual({ points: 15, maxPoints: 15, checksUsed: 0, hintsUsed: 0, won: true });
  });

  it("score reports zero points and not-won before anything is submitted", () => {
    const state = engine.init(fixturePuzzle());
    const s = engine.score(state);
    expect(s.points).toBe(0);
    expect(s.won).toBe(false);
    expect(s.maxPoints).toBe(15);
  });

  it("score reports partial credit correctly when the puzzle finishes with zero-point answers mixed in", () => {
    let state = engine.init(fixturePuzzle());
    const guesses = [100, 5000, 11, 1350, 5]; // 3 + 0 + 2 + 1 + 3 = 9
    for (const guess of guesses) {
      state = submitValue(state, guess);
    }
    const s = engine.score(state);
    expect(s.points).toBe(9);
    expect(s.won).toBe(true); // "won" tracks completion, not a points threshold — see engine.ts doc comment
  });

  it("hintsUsed is carried through to score", () => {
    let state = engine.reduce(engine.init(fixturePuzzle()), { type: "hint" });
    state = submitValue(state, 100);
    const s = engine.score(state);
    expect(s.hintsUsed).toBe(1);
  });
});
