import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { generate } from "./generate";
import type { BraidPuzzle } from "./generate";
import type { BraidState } from "./engine";

function makePuzzle(seed = 2) {
  return generate(seed, "medium"); // even seed -> 2 words
}

/**
 * A hand-built 2-word puzzle with equal-length, disjoint-letter words, used
 * by tests that repeatedly need a "full but wrong" assignment across
 * several checks. Equal lengths guarantee there's always another unlocked,
 * differently-sourced letter to swap with, unlike a real generated puzzle
 * whose two words can have very different lengths.
 */
function fixturePuzzle(): BraidPuzzle {
  const words = ["ABCDE", "FGHIJ"];
  const letters = [
    { ch: "A", src: 0 },
    { ch: "F", src: 1 },
    { ch: "B", src: 0 },
    { ch: "G", src: 1 },
    { ch: "C", src: 0 },
    { ch: "H", src: 1 },
    { ch: "D", src: 0 },
    { ch: "I", src: 1 },
    { ch: "E", src: 0 },
    { ch: "J", src: 1 },
  ];
  return { seed: 0, difficulty: "hard", theme: "test theme", words, letters };
}

/**
 * A full (every count matches its word's length), deliberately-wrong
 * assignment: swap two unlocked letters that belong to different words.
 * Swapping preserves per-strand counts regardless of word-length balance
 * (unlike e.g. shifting every index by 1, which only stays "full" when
 * every word happens to share the same length).
 */
function fullWrongAssign(state: BraidState): number[] {
  const assign = state.puzzle.letters.map((l) => l.src);
  const unlocked = assign.map((_, i) => i).filter((i) => !state.locked[i]);
  const i = unlocked[0];
  const j = unlocked.find((idx) => idx !== i && assign[idx] !== assign[i as number]);
  if (i !== undefined && j !== undefined) {
    const tmp = assign[i] as number;
    assign[i] = assign[j] as number;
    assign[j] = tmp;
  }
  return assign;
}

describe("init", () => {
  it("starts fully unassigned, unlocked, with the theme hidden", () => {
    const state = engine.init(makePuzzle());
    expect(state.assign.every((a) => a === -1)).toBe(true);
    expect(state.locked.every((l) => !l)).toBe(true);
    expect(state.themeRevealed).toBe(false);
    expect(state.checksUsed).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.done).toBe(false);
  });
});

describe("reduce: assign", () => {
  it("cycles a letter through unassigned -> strand 0 -> strand 1 -> unassigned", () => {
    let state = engine.init(makePuzzle());
    state = engine.reduce(state, { type: "assign", index: 0 });
    expect(state.assign[0]).toBe(0);
    state = engine.reduce(state, { type: "assign", index: 0 });
    expect(state.assign[0]).toBe(1);
    state = engine.reduce(state, { type: "assign", index: 0 });
    expect(state.assign[0]).toBe(-1);
  });

  it("cycles through 3 strands for a triple puzzle", () => {
    let state = engine.init(generate(3, "hard")); // odd seed -> triple
    for (let i = 0; i < 4; i += 1) {
      state = engine.reduce(state, { type: "assign", index: 0 });
    }
    expect(state.assign[0]).toBeGreaterThanOrEqual(-1);
    expect(state.puzzle.words).toHaveLength(3);
  });

  it("is a no-op on a locked letter", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, locked: state.locked.map((_, i) => i === 0) };
    const next = engine.reduce(state, { type: "assign", index: 0 });
    expect(next).toBe(state);
  });

  it("clears the wrong-flash flags on any assign", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, wrongIds: [1, 2] };
    const next = engine.reduce(state, { type: "assign", index: 0 });
    expect(next.wrongIds).toEqual([]);
  });

  it("ignores moves once the puzzle is done", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "assign", index: 0 });
    expect(next).toBe(state);
  });
});

describe("reduce: clear", () => {
  it("resets unlocked assignments but keeps locked ones", () => {
    let state = engine.init(makePuzzle());
    state = engine.reduce(state, { type: "assign", index: 0 });
    state = { ...state, locked: state.locked.map((_, i) => i === 1), assign: state.assign.map((a, i) => (i === 1 ? 0 : a)) };
    const next = engine.reduce(state, { type: "clear" });
    expect(next.assign[0]).toBe(-1);
    expect(next.assign[1]).toBe(0);
  });
});

describe("reduce: check", () => {
  function fillCorrectly(state: BraidState): BraidState {
    return { ...state, assign: state.puzzle.letters.map((l) => l.src) };
  }

  it("does nothing if the board isn't full", () => {
    const state = engine.init(makePuzzle());
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });

  it("wins immediately when every letter is correctly assigned", () => {
    let state = engine.init(makePuzzle());
    state = fillCorrectly(state);
    const next = engine.reduce(state, { type: "check" });
    expect(next.done).toBe(true);
    expect(next.won).toBe(true);
    expect(next.checksUsed).toBe(1);
    expect(next.history).toEqual(["🟩"]);
  });

  it("reports singular phrasing for exactly one wrong letter (standalone check, unassigned letters counted as wrong)", () => {
    let state = engine.init(fixturePuzzle());
    const correct = state.puzzle.letters.map((l) => l.src);
    correct[0] = -1; // leave the first letter unassigned entirely
    state = { ...state, assign: correct };
    const { state: next } = engine.check(state);
    expect(next.message).toContain("1 letter is on the wrong strand");
  });

  it("is colour-permutation-aware: a globally-swapped assignment still wins", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, assign: state.puzzle.letters.map((l) => 1 - l.src) }; // swap strand labels
    const next = engine.reduce(state, { type: "check" });
    expect(next.won).toBe(true);
  });

  it("locks one wrong letter and reports the wrong count when not fully correct", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, assign: fullWrongAssign(state) };
    const next = engine.reduce(state, { type: "check" });
    expect(next.checksUsed).toBe(1);
    expect(next.locked.filter(Boolean)).toHaveLength(1);
    expect(next.done).toBe(false);
    expect(next.won).toBe(false);
    expect(next.message).toMatch(/wrong strand/);
  });

  it("reveals the theme exactly at check 2 and stays revealed after", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, assign: fullWrongAssign(state) };
    state = engine.reduce(state, { type: "check" });
    expect(state.themeRevealed).toBe(state.checksUsed >= engine.THEME_AT_CHECK);
    expect(state.done).toBe(false);
    state = { ...state, assign: fullWrongAssign(state) };
    state = engine.reduce(state, { type: "check" });
    expect(state.themeRevealed).toBe(true);
  });

  it("ends the puzzle as a loss after MAX_CHECKS unsuccessful checks", () => {
    let state = engine.init(fixturePuzzle());
    for (let i = 0; i < engine.MAX_CHECKS && !state.done; i += 1) {
      state = { ...state, assign: fullWrongAssign(state) };
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.done).toBe(true);
    expect(state.won).toBe(false);
    expect(state.checksUsed).toBe(engine.MAX_CHECKS);
  });
});

describe("reduce: hint", () => {
  it("first hint before check 2 reveals the theme without locking a letter", () => {
    let state = engine.init(makePuzzle());
    const before = state.locked.filter(Boolean).length;
    state = engine.reduce(state, { type: "hint" });
    expect(state.themeRevealed).toBe(true);
    expect(state.hintsUsed).toBe(1);
    expect(state.locked.filter(Boolean).length).toBe(before);
  });

  it("a later hint locks the open letter closest to the middle", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, themeRevealed: true, checksUsed: engine.THEME_AT_CHECK };
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.locked.filter(Boolean)).toHaveLength(1);
  });

  it("does nothing once MAX_HINTS is reached", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, hintsUsed: engine.MAX_HINTS };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("does nothing once the puzzle is done", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("reports nothing left to hint when only one letter remains open", () => {
    let state = engine.init(makePuzzle());
    state = {
      ...state,
      themeRevealed: true,
      checksUsed: engine.THEME_AT_CHECK,
      locked: state.locked.map((_, i) => i !== 0),
    };
    const next = engine.reduce(state, { type: "hint" });
    expect(next.message).toBe("Nothing left to hint.");
    expect(next.hintsUsed).toBe(state.hintsUsed);
  });

  it("the standalone hint() matches reduce's hint move", () => {
    const state = engine.init(makePuzzle());
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("check/isDone/score", () => {
  it("the standalone check() matches reduce's check move (state half)", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, assign: state.puzzle.letters.map((l) => l.src) };
    const viaReduce = engine.reduce(state, { type: "check" });
    const viaCheck = engine.check(state);
    expect(viaCheck.state).toEqual(viaReduce);
    expect(viaCheck.result.done).toBe(true);
  });

  it("isDone mirrors state.done", () => {
    const state = engine.init(makePuzzle());
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score reflects a win with checks-used-based points", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, assign: state.puzzle.letters.map((l) => l.src) };
    state = engine.reduce(state, { type: "check" });
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.points).toBe(engine.MAX_CHECKS);
    expect(s.checksUsed).toBe(1);
  });

  it("score reflects a loss with zero points", () => {
    const state: BraidState = { ...engine.init(makePuzzle()), done: true, won: false, checksUsed: engine.MAX_CHECKS };
    const s = engine.score(state);
    expect(s.won).toBe(false);
    expect(s.points).toBe(0);
  });
});

describe("canCheck", () => {
  it("is false until every letter is assigned to a valid count per strand", () => {
    const state = engine.init(makePuzzle());
    expect(engine.canCheck(state)).toBe(false);
  });

  it("is true once counts match each word's length", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, assign: state.puzzle.letters.map((l) => l.src) };
    expect(engine.canCheck(state)).toBe(true);
  });

  it("is false once the puzzle is done", () => {
    let state = engine.init(makePuzzle());
    state = { ...state, assign: state.puzzle.letters.map((l) => l.src), done: true };
    expect(engine.canCheck(state)).toBe(false);
  });
});
