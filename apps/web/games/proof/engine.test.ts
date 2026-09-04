import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { generate } from "./generate";
import type { ProofPassage } from "./generate";
import type { ProofState } from "./engine";

function makePassage(seed = 1) {
  return generate(seed, "medium");
}

/**
 * A small hand-built fixture (10 words, impostors at 1/3/5/7/9) used by
 * tests that need precise, deterministic control over flags across several
 * checks/hints, rather than a real content-pack passage.
 */
function fixturePassage(): ProofPassage {
  return {
    id: "fixture",
    seed: 0,
    difficulty: "medium",
    words: ["The", "cot", "sat", "won", "on", "there", "a", "mate", "and", "read."],
    impostorIndices: [1, 3, 5, 7, 9],
  };
}

function flagAll(state: ProofState, indices: readonly number[]): ProofState {
  let next = state;
  for (const i of indices) {
    next = engine.reduce(next, { type: "toggleFlag", index: i });
  }
  return next;
}

describe("init", () => {
  it("starts with nothing flagged or locked, zero checks/hints, not done", () => {
    const state = engine.init(makePassage());
    expect(state.flagged.every((f) => !f)).toBe(true);
    expect(state.locked.every((l) => !l)).toBe(true);
    expect(state.checksUsed).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.history).toEqual([]);
  });
});

describe("reduce: toggleFlag", () => {
  it("flags an unflagged word", () => {
    const state = engine.init(fixturePassage());
    const next = engine.reduce(state, { type: "toggleFlag", index: 1 });
    expect(next.flagged[1]).toBe(true);
  });

  it("unflags an already-flagged word (toggle)", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "toggleFlag", index: 1 });
    state = engine.reduce(state, { type: "toggleFlag", index: 1 });
    expect(state.flagged[1]).toBe(false);
  });

  it("is a no-op on a locked word", () => {
    let state = engine.init(fixturePassage());
    state = { ...state, locked: state.locked.map((_, i) => i === 1) };
    const next = engine.reduce(state, { type: "toggleFlag", index: 1 });
    expect(next).toBe(state);
  });

  it("ignores moves once the puzzle is done", () => {
    let state = engine.init(fixturePassage());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "toggleFlag", index: 0 });
    expect(next).toBe(state);
  });
});

describe("reduce: check", () => {
  it("does nothing if nothing is flagged (0 of 5 correct, not done)", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "check" });
    expect(state.checksUsed).toBe(1);
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.message).toContain("0 of 5");
  });

  it("wins immediately when exactly the 5 true impostors are flagged", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, fixturePassage().impostorIndices);
    state = engine.reduce(state, { type: "check" });
    expect(state.done).toBe(true);
    expect(state.won).toBe(true);
    expect(state.checksUsed).toBe(1);
    expect(state.history).toEqual(["🟩"]);
    expect(state.message).toBe("Cleared!");
  });

  it("does not win if all impostors are flagged plus an extra wrong word", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, [...fixturePassage().impostorIndices, 0]);
    state = engine.reduce(state, { type: "check" });
    expect(state.won).toBe(false);
    expect(state.message).toContain("5 of 5");
    expect(state.message).toContain("1 flagged word wasn't");
  });

  it("reports plural phrasing for more than one extra wrong flag", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, [...fixturePassage().impostorIndices, 0, 2]);
    state = engine.reduce(state, { type: "check" });
    expect(state.message).toContain("2 flagged words weren't");
  });

  it("reports partial correctness when only some impostors are flagged", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, [1, 3]);
    state = engine.reduce(state, { type: "check" });
    expect(state.checksUsed).toBe(1);
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.message).toBe("2 of 5 impostors correctly flagged.");
    expect(state.history).toEqual(["🟥🟥🟥"]);
  });

  it("ends the puzzle as a loss after MAX_CHECKS unsuccessful checks", () => {
    let state = engine.init(fixturePassage());
    for (let i = 0; i < engine.MAX_CHECKS; i += 1) {
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.done).toBe(true);
    expect(state.won).toBe(false);
    expect(state.checksUsed).toBe(engine.MAX_CHECKS);
    expect(state.message).toBe("Out of checks.");
  });

  it("ignores a check move once the puzzle is already done", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, fixturePassage().impostorIndices);
    state = engine.reduce(state, { type: "check" });
    expect(state.won).toBe(true);
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });

  it("does not mutate flags or locks on check", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, [1, 3]);
    const next = engine.reduce(state, { type: "check" });
    expect(next.flagged).toEqual(state.flagged);
    expect(next.locked).toEqual(state.locked);
  });
});

describe("reduce: hint", () => {
  it("flags and locks one impostor", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    const lockedIndices = state.locked.map((l, i) => (l ? i : -1)).filter((i) => i >= 0);
    expect(lockedIndices).toHaveLength(1);
    expect(fixturePassage().impostorIndices).toContain(lockedIndices[0]);
    expect(state.flagged[lockedIndices[0] as number]).toBe(true);
  });

  it("reveals a different impostor on each successive hint", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "hint" });
    state = engine.reduce(state, { type: "hint" });
    const lockedIndices = state.locked.map((l, i) => (l ? i : -1)).filter((i) => i >= 0);
    expect(lockedIndices).toHaveLength(2);
  });

  it("does nothing once MAX_HINTS is reached", () => {
    let state = engine.init(fixturePassage());
    state = { ...state, hintsUsed: engine.MAX_HINTS };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("does nothing once the puzzle is done", () => {
    let state = engine.init(fixturePassage());
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("reports nothing left to hint once every impostor is already locked", () => {
    let state = engine.init(fixturePassage());
    state = { ...state, locked: state.locked.map((_, i) => fixturePassage().impostorIndices.includes(i)) };
    const next = engine.reduce(state, { type: "hint" });
    expect(next.message).toBe("Nothing left to hint.");
    expect(next.hintsUsed).toBe(state.hintsUsed);
  });

  it("the standalone hint() matches reduce's hint move", () => {
    const state = engine.init(fixturePassage());
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("check/isDone/score", () => {
  it("the standalone check() matches reduce's check move (state half)", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, fixturePassage().impostorIndices);
    const viaReduce = engine.reduce(state, { type: "check" });
    const viaCheck = engine.check(state);
    expect(viaCheck.state).toEqual(viaReduce);
    expect(viaCheck.result.done).toBe(true);
    expect(viaCheck.result.correctCount).toBe(5);
    expect(viaCheck.result.totalCount).toBe(5);
  });

  it("isDone mirrors state.done", () => {
    const state = engine.init(makePassage());
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score reflects a win with checks-used-based points", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, fixturePassage().impostorIndices);
    state = engine.reduce(state, { type: "check" });
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.points).toBe(engine.MAX_CHECKS);
    expect(s.checksUsed).toBe(1);
    expect(s.maxPoints).toBe(engine.MAX_CHECKS);
  });

  it("score reflects fewer points the more checks a win took", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "check" }); // wasted check #1
    state = flagAll(state, fixturePassage().impostorIndices);
    state = engine.reduce(state, { type: "check" }); // win on check #2
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.checksUsed).toBe(2);
    expect(s.points).toBe(engine.MAX_CHECKS - 1);
  });

  it("score reflects a loss with zero points", () => {
    const state: ProofState = { ...engine.init(makePassage()), done: true, won: false, checksUsed: engine.MAX_CHECKS };
    const s = engine.score(state);
    expect(s.won).toBe(false);
    expect(s.points).toBe(0);
  });
});

describe("canCheck", () => {
  it("is true before the puzzle is done, even with nothing flagged", () => {
    const state = engine.init(makePassage());
    expect(engine.canCheck(state)).toBe(true);
  });

  it("is false once the puzzle is done", () => {
    const state = { ...engine.init(makePassage()), done: true };
    expect(engine.canCheck(state)).toBe(false);
  });
});
