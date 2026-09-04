import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { ProofPassage } from "./generate";
import type { ProofState } from "./engine";
import { shareGrid } from "./share";

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

describe("shareGrid", () => {
  it("shows the checks-used fraction and one emoji line per check for a win", () => {
    let state = engine.init(fixturePassage());
    state = flagAll(state, fixturePassage().impostorIndices);
    state = engine.reduce(state, { type: "check" });
    expect(shareGrid(state)).toBe(`Proof 1/${String(engine.MAX_CHECKS)}\n\n🟩`);
  });

  it("shows X for a loss and appends 💡 per hint used", () => {
    let state = engine.init(fixturePassage());
    state = engine.reduce(state, { type: "hint" });
    for (let i = 0; i < engine.MAX_CHECKS; i += 1) {
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.won).toBe(false);
    const text = shareGrid(state);
    expect(text.startsWith(`Proof X/${String(engine.MAX_CHECKS)} 💡`)).toBe(true);
    const lines = text.split("\n").filter((line) => line.length > 0 && line !== text.split("\n")[0]);
    expect(lines).toHaveLength(state.checksUsed);
  });
});
