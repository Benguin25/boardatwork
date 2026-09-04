import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { CellMark } from "./engine";
import type { OrgAssignment, OrgPuzzle } from "./generate";
import { shareGrid } from "./share";

const PEOPLE = ["Priya", "Chen", "Marcus", "Sofia", "Devon"];
const ROLES = ["Design", "Sales", "Finance", "Engineering", "Support"];
const TEAMS = ["Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6"];

function fixturePuzzle(): OrgPuzzle {
  const solution: OrgAssignment = { role: [0, 1, 2, 3, 4], team: [4, 3, 2, 1, 0] };
  return {
    seed: 0,
    difficulty: "hard",
    people: PEOPLE,
    roles: ROLES,
    teams: TEAMS,
    solution,
    clues: [{ id: "c1", text: "Priya is the Design lead.", check: (c) => c.role[0] === 0 }],
  };
}

function correctMarks(solution: OrgAssignment): CellMark[][] {
  return solution.role.map((r, p) => {
    const row: CellMark[] = Array.from({ length: 10 }, () => "empty");
    for (let c = 0; c < 5; c += 1) {
      row[c] = c === r ? "yes" : "no";
    }
    const t = solution.team[p] as number;
    for (let c = 5; c < 10; c += 1) {
      row[c] = c - 5 === t ? "yes" : "no";
    }
    return row;
  });
}

function fullWrongRoleMarks(solution: OrgAssignment): CellMark[][] {
  const marks = correctMarks(solution);
  return marks.map((row, p) => {
    const wrongRole = ((solution.role[p] as number) + 1) % 5;
    const next: CellMark[] = row.slice();
    for (let c = 0; c < 5; c += 1) {
      next[c] = c === wrongRole ? "yes" : "no";
    }
    return next;
  });
}

describe("shareGrid", () => {
  it("shows the checks-used fraction and one 🟩 line for a win", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    state = engine.reduce(state, { type: "check" });
    expect(shareGrid(state)).toBe(`Org 1/${String(engine.MAX_CHECKS)}\n\n🟩`);
  });

  it("shows X for a loss, appends 💡 per hint used, and one partial line per check", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, marks: fullWrongRoleMarks(state.puzzle.solution) };
    state = engine.reduce(state, { type: "hint" }); // uses a hint, doesn't affect the marks used below
    for (let i = 0; i < engine.MAX_CHECKS && !state.done; i += 1) {
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.won).toBe(false);
    const text = shareGrid(state);
    expect(text.startsWith(`Org X/${String(engine.MAX_CHECKS)} 💡`)).toBe(true);
    const lines = text.split("\n").filter((line) => line.length > 0 && line !== text.split("\n")[0]);
    expect(lines).toHaveLength(state.checksUsed);
    expect(lines.every((line) => [...line].every((ch) => ch === "🟨"))).toBe(true);
  });
});
