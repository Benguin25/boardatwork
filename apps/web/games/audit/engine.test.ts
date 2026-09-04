import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { generate, type AuditPuzzle } from "./generate";
import type { AuditState } from "./engine";

function makePuzzle(seed = 1, difficulty: "easy" | "medium" | "hard" = "medium"): AuditPuzzle {
  return generate(seed, difficulty);
}

/**
 * A hand-built puzzle with 3 altered cells at known indices (0, 6, 18 — a
 * diagonal-ish spread, distinct rows and columns), used by tests that need
 * exact control over which cells are "altered" rather than incidental
 * generator output.
 */
function fixturePuzzle(): AuditPuzzle {
  const trueGrid = Array.from({ length: 25 }, (_, i) => 20 + i);
  const rowTotals = [0, 1, 2, 3, 4].map((r) => {
    let total = 0;
    for (let c = 0; c < 5; c += 1) total += trueGrid[r * 5 + c] as number;
    return total;
  });
  const colTotals = [0, 1, 2, 3, 4].map((c) => {
    let total = 0;
    for (let r = 0; r < 5; r += 1) total += trueGrid[r * 5 + c] as number;
    return total;
  });
  const displayedGrid = trueGrid.slice();
  const alteredCells = [0, 6, 18];
  displayedGrid[0] = (trueGrid[0] as number) + 5;
  displayedGrid[6] = (trueGrid[6] as number) - 4;
  displayedGrid[18] = (trueGrid[18] as number) + 9;
  return {
    seed: 0,
    difficulty: "easy",
    k: 3,
    trueGrid,
    displayedGrid,
    rowTotals,
    colTotals,
    alteredCells,
  };
}

function flagAll(state: AuditState, indices: readonly number[]): AuditState {
  return { ...state, flagged: state.flagged.map((_, i) => indices.includes(i)) };
}

describe("init", () => {
  it("starts fully unflagged, unlocked, and not done", () => {
    const state = engine.init(makePuzzle());
    expect(state.flagged.every((f) => !f)).toBe(true);
    expect(state.locked.every((l) => !l)).toBe(true);
    expect(state.checksUsed).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.log).toHaveLength(1);
  });
});

describe("reduce: toggle", () => {
  it("flags an unflagged cell and unflags a flagged one", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "toggle", index: 2 });
    expect(state.flagged[2]).toBe(true);
    state = engine.reduce(state, { type: "toggle", index: 2 });
    expect(state.flagged[2]).toBe(false);
  });

  it("is a no-op on a locked cell", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, locked: state.locked.map((_, i) => i === 0), flagged: state.flagged.map((_, i) => i === 0) };
    const next = engine.reduce(state, { type: "toggle", index: 0 });
    expect(next).toBe(state);
  });

  it("ignores moves once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "toggle", index: 0 });
    expect(next).toBe(state);
  });
});

describe("canCheck / reduce: check", () => {
  it("is false until exactly k cells are flagged", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.canCheck(state)).toBe(false);
    const oneFlagged = flagAll(state, [0]);
    expect(engine.canCheck(oneFlagged)).toBe(false);
    const threeFlagged = flagAll(state, [0, 6, 18]);
    expect(engine.canCheck(threeFlagged)).toBe(true);
  });

  it("does nothing if not exactly k cells are flagged", () => {
    const state = flagAll(engine.init(fixturePuzzle()), [0, 6]);
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });

  it("wins immediately when the flagged set exactly matches the altered set", () => {
    const state = flagAll(engine.init(fixturePuzzle()), [0, 6, 18]);
    const next = engine.reduce(state, { type: "check" });
    expect(next.done).toBe(true);
    expect(next.won).toBe(true);
    expect(next.checksUsed).toBe(1);
    expect(next.history).toEqual(["🟩🟩🟩"]);
    expect(next.message).toContain("Cleared");
  });

  it("reports a partial-correct count and stays open when not fully correct", () => {
    // Flag 0 and 6 (correct) plus 1 (wrong) instead of 18.
    const state = flagAll(engine.init(fixturePuzzle()), [0, 6, 1]);
    const next = engine.reduce(state, { type: "check" });
    expect(next.done).toBe(false);
    expect(next.won).toBe(false);
    expect(next.checksUsed).toBe(1);
    expect(next.history).toEqual(["🟩🟩⬛"]);
    expect(next.message).toBe("2/3 flagged cells correct.");
  });

  it("reports zero correct when every flag is wrong", () => {
    const state = flagAll(engine.init(fixturePuzzle()), [1, 2, 3]);
    const next = engine.reduce(state, { type: "check" });
    expect(next.history).toEqual(["⬛⬛⬛"]);
  });

  it("ends the puzzle as a loss after MAX_CHECKS unsuccessful checks, still allowing the final check move through the done-gate", () => {
    let state = flagAll(engine.init(fixturePuzzle()), [1, 2, 3]);
    for (let i = 0; i < engine.MAX_CHECKS; i += 1) {
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.done).toBe(true);
    expect(state.won).toBe(false);
    expect(state.checksUsed).toBe(engine.MAX_CHECKS);
    expect(state.message).toContain("Out of checks");
    // The done-gate lets "check" through, but runCheck's own canCheck guard no-ops it.
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });
});

describe("reduce: hint", () => {
  it("reveals and locks in one altered cell, flagging it", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    const revealed = state.locked.map((l, i) => (l ? i : -1)).filter((i) => i >= 0);
    expect(revealed).toHaveLength(1);
    expect([0, 6, 18]).toContain(revealed[0]);
    expect(state.flagged[revealed[0] as number]).toBe(true);
  });

  it("locks a different cell on each successive hint, in ascending index order", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" });
    const locked = state.locked.map((l, i) => (l ? i : -1)).filter((i) => i >= 0);
    expect(locked).toEqual([0, 6]);
    expect(state.hintsUsed).toBe(2);
  });

  it("does nothing once MAX_HINTS is reached", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, hintsUsed: engine.MAX_HINTS };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("does nothing once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("reports nothing left to hint (without consuming a hint) once every altered cell is already locked", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" }); // all 3 altered cells now locked; hintsUsed = 3 = MAX_HINTS
    // Re-open headroom to isolate the "nothing left" branch from the MAX_HINTS branch.
    state = { ...state, hintsUsed: 1 };
    const next = engine.reduce(state, { type: "hint" });
    expect(next.message).toBe("Nothing left to hint.");
    expect(next.hintsUsed).toBe(1);
  });

  it("the standalone hint() matches reduce's hint move", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("check/isDone/score", () => {
  it("the standalone check() matches reduce's check move (state half)", () => {
    const state = flagAll(engine.init(fixturePuzzle()), [0, 6, 18]);
    const viaReduce = engine.reduce(state, { type: "check" });
    const viaCheck = engine.check(state);
    expect(viaCheck.state).toEqual(viaReduce);
    expect(viaCheck.result.done).toBe(true);
    expect(viaCheck.result.correctCount).toBe(3);
    expect(viaCheck.result.totalCount).toBe(3);
  });

  it("isDone mirrors state.done", () => {
    const state = engine.init(makePuzzle());
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score reflects a win with checks-used-based points", () => {
    const state = engine.reduce(flagAll(engine.init(fixturePuzzle()), [0, 6, 18]), { type: "check" });
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.points).toBe(engine.MAX_CHECKS);
    expect(s.checksUsed).toBe(1);
    expect(s.maxPoints).toBe(engine.MAX_CHECKS);
  });

  it("score gives fewer points for more checks used on a win", () => {
    let state = flagAll(engine.init(fixturePuzzle()), [1, 2, 3]);
    state = engine.reduce(state, { type: "check" }); // check 1: wrong
    state = flagAll(state, [0, 6, 18]);
    state = engine.reduce(state, { type: "check" }); // check 2: win
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.checksUsed).toBe(2);
    expect(s.points).toBe(engine.MAX_CHECKS - 1);
  });

  it("score reflects a loss with zero points", () => {
    const state: AuditState = { ...engine.init(makePuzzle()), done: true, won: false, checksUsed: engine.MAX_CHECKS };
    const s = engine.score(state);
    expect(s.won).toBe(false);
    expect(s.points).toBe(0);
  });
});
