import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { AuditPuzzle } from "./generate";
import { shareGrid } from "./share";

function fixturePuzzle(): AuditPuzzle {
  const trueGrid = Array.from({ length: 25 }, (_, i) => 20 + i);
  const displayedGrid = trueGrid.slice();
  const alteredCells = [0, 6, 18];
  displayedGrid[0] = (trueGrid[0] as number) + 5;
  displayedGrid[6] = (trueGrid[6] as number) - 4;
  displayedGrid[18] = (trueGrid[18] as number) + 9;
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
  return { seed: 0, difficulty: "easy", k: 3, trueGrid, displayedGrid, rowTotals, colTotals, alteredCells };
}

function flagAll(state: engine.AuditState, indices: readonly number[]): engine.AuditState {
  return { ...state, flagged: state.flagged.map((_, i) => indices.includes(i)) };
}

describe("shareGrid", () => {
  it("shows the checks-used fraction and one emoji line per check for a win", () => {
    let state = flagAll(engine.init(fixturePuzzle()), [0, 6, 18]);
    state = engine.reduce(state, { type: "check" });
    expect(shareGrid(state)).toBe(`Audit 1/${String(engine.MAX_CHECKS)}\n\n🟩🟩🟩`);
  });

  it("shows X for a loss, appends 💡 per hint used, and never leaks a row/column number", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" }); // locks in cell 0, no check consumed
    for (let i = 0; i < engine.MAX_CHECKS; i += 1) {
      state = flagAll(state, [0, 1, 2]); // always includes at least one wrong cell (1 or 2)
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.won).toBe(false);
    const text = shareGrid(state);
    expect(text.startsWith(`Audit X/${String(engine.MAX_CHECKS)} 💡`)).toBe(true);
    const lines = text.split("\n").filter((line, i) => i > 1);
    expect(lines).toHaveLength(state.checksUsed);
    for (const line of lines) {
      expect(line).toMatch(/^[🟩⬛]+$/); // per-check lines: emoji only, never a row/column number
    }
  });
});
