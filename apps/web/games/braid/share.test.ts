import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { generate } from "./generate";
import type { BraidPuzzle } from "./generate";
import type { BraidState } from "./engine";
import { shareGrid } from "./share";

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

describe("shareGrid", () => {
  it("shows the checks-used fraction and one emoji line per check for a win", () => {
    let state = engine.init(generate(2, "medium"));
    state = { ...state, assign: state.puzzle.letters.map((l) => l.src) };
    state = engine.reduce(state, { type: "check" });
    expect(shareGrid(state)).toBe(`Braid 1/${String(engine.MAX_CHECKS)}\n\n🟩`);
  });

  it("shows X for a loss and appends 💡 per hint used", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" }); // theme reveal, no lock
    for (let i = 0; i < engine.MAX_CHECKS && !state.done; i += 1) {
      state = { ...state, assign: fullWrongAssign(state) };
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.won).toBe(false);
    const text = shareGrid(state);
    expect(text.startsWith(`Braid X/${String(engine.MAX_CHECKS)} 💡`)).toBe(true);
    expect(text.split("\n").filter((line) => line.length > 0 && line !== text.split("\n")[0])).toHaveLength(
      state.checksUsed,
    );
  });
});
