import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { CellMark, OrgState } from "./engine";
import type { OrgAssignment, OrgPuzzle } from "./generate";

const PEOPLE = ["Priya", "Chen", "Marcus", "Sofia", "Devon"];
const ROLES = ["Design", "Sales", "Finance", "Engineering", "Support"];
const TEAMS = ["Floor 2", "Floor 3", "Floor 4", "Floor 5", "Floor 6"];

/** Hand-built fixture: role[p] = p, team[p] = 4 - p, so every axis has a distinct, easy-to-reason-about value. */
function fixturePuzzle(): OrgPuzzle {
  const solution: OrgAssignment = { role: [0, 1, 2, 3, 4], team: [4, 3, 2, 1, 0] };
  return {
    seed: 0,
    difficulty: "hard",
    people: PEOPLE,
    roles: ROLES,
    teams: TEAMS,
    solution,
    clues: [
      { id: "c1", text: "Priya is the Design lead.", check: (c) => c.role[0] === 0 },
      { id: "c2", text: "Devon is on Floor 2.", check: (c) => c.team[4] === 0 },
    ],
  };
}

/** Fully, correctly filled marks for `solution` (every person's role and team yes cell matches the truth, siblings no). */
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

/** A full grid where every person's *team* is correct but every person's *role* is wrong (rotate role assignments by one). */
function fullWrongRoleMarks(solution: OrgAssignment): CellMark[][] {
  const marks = correctMarks(solution);
  return marks.map((row, p) => {
    const wrongRole = (((solution.role[p] as number) + 1) % 5);
    const next: CellMark[] = row.slice();
    for (let c = 0; c < 5; c += 1) {
      next[c] = c === wrongRole ? "yes" : "no";
    }
    return next;
  });
}

function makeState(): OrgState {
  return engine.init(fixturePuzzle());
}

describe("init", () => {
  it("starts fully empty, unlocked, with one log entry per clue", () => {
    const state = makeState();
    expect(state.marks.every((row) => row.every((cell) => cell === "empty"))).toBe(true);
    expect(state.locked.every((row) => row.every((l) => !l))).toBe(true);
    expect(state.checksUsed).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.log).toHaveLength(2);
    expect(state.log[0]).toEqual({ id: "c1", author: "Policy", text: "Priya is the Design lead." });
  });
});

describe("reduce: mark", () => {
  it("cycles a cell empty -> yes -> no -> empty", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(state.marks[0]?.[0]).toBe("yes");
    state = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(state.marks[0]?.[0]).toBe("no");
    state = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(state.marks[0]?.[0]).toBe("empty");
  });

  it("marking a cell yes sets every other cell in that person's column-group to no", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "mark", person: 0, col: 2 });
    expect(state.marks[0]).toEqual(["no", "no", "yes", "no", "no", "empty", "empty", "empty", "empty", "empty"]);
    // Marking a different role column afterwards re-picks the "yes" — its
    // sibling cells started "no" (from the first cascade above), so it
    // takes two taps (no -> empty -> yes) to get there.
    state = engine.reduce(state, { type: "mark", person: 0, col: 4 });
    state = engine.reduce(state, { type: "mark", person: 0, col: 4 });
    expect(state.marks[0]).toEqual(["no", "no", "no", "no", "yes", "empty", "empty", "empty", "empty", "empty"]);
  });

  it("marking yes in the team group doesn't touch the role group for the same person", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "mark", person: 1, col: 0 });
    state = engine.reduce(state, { type: "mark", person: 1, col: 7 });
    expect(state.marks[1]?.slice(0, 5)).toEqual(["yes", "no", "no", "no", "no"]);
    expect(state.marks[1]?.slice(5, 10)).toEqual(["no", "no", "yes", "no", "no"]);
  });

  it("is a no-op on a locked cell", () => {
    let state = makeState();
    state = { ...state, locked: state.locked.map((row, p) => (p === 0 ? row.map((_, c) => c === 0) : row)) };
    const next = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(next).toBe(state);
  });

  it("ignores moves once the puzzle is done", () => {
    let state = makeState();
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(next).toBe(state);
  });
});

describe("reduce: check", () => {
  it("does nothing if the grid isn't full", () => {
    const state = makeState();
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });

  it("is not full if some people have a role yes but no team yes (or vice versa)", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "mark", person: 0, col: 0 });
    expect(engine.canCheck(state)).toBe(false);
  });

  it("wins immediately when every cell is correctly marked", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    const next = engine.reduce(state, { type: "check" });
    expect(next.done).toBe(true);
    expect(next.won).toBe(true);
    expect(next.checksUsed).toBe(1);
    expect(next.history).toEqual(["🟩"]);
    expect(next.message).toBe("Cleared!");
  });

  it("reports a not-which count when partially correct (team correct, role wrong for everyone)", () => {
    let state = makeState();
    state = { ...state, marks: fullWrongRoleMarks(state.puzzle.solution) };
    const { state: next, result } = engine.check(state);
    // 5 people x 2 axes = 10 total; team axis (5) correct, role axis (0) correct -> 5 correct.
    expect(result.correctCount).toBe(5);
    expect(result.totalCount).toBe(10);
    expect(result.done).toBe(false);
    expect(next.won).toBe(false);
    expect(next.history).toEqual(["🟨🟨🟨🟨🟨"]);
    expect(next.message).toBe("5/10 correct.");
  });

  it("ends the puzzle as a loss after MAX_CHECKS unsuccessful checks", () => {
    let state = makeState();
    state = { ...state, marks: fullWrongRoleMarks(state.puzzle.solution) };
    for (let i = 0; i < engine.MAX_CHECKS && !state.done; i += 1) {
      state = engine.reduce(state, { type: "check" });
    }
    expect(state.done).toBe(true);
    expect(state.won).toBe(false);
    expect(state.checksUsed).toBe(engine.MAX_CHECKS);
    expect(state.message).toBe("Out of checks.");
  });

  it("further check moves are a no-op once done", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    state = engine.reduce(state, { type: "check" });
    const next = engine.reduce(state, { type: "check" });
    expect(next).toBe(state);
  });
});

describe("reduce: hint", () => {
  it("fills in the first person's role when nothing is marked yet, and locks that axis", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.marks[0]?.slice(0, 5)).toEqual(["yes", "no", "no", "no", "no"]);
    expect(state.locked[0]?.slice(0, 5)).toEqual([true, true, true, true, true]);
    expect(state.locked[0]?.slice(5, 10)).toEqual([false, false, false, false, false]);
    expect(state.message).toContain("Priya");
  });

  it("moves on to a person's team once their role is already correct", () => {
    let state = makeState();
    state = {
      ...state,
      marks: state.marks.map((row, p) => (p === 0 ? correctMarks(state.puzzle.solution)[0] as CellMark[] : row)),
    };
    state = engine.reduce(state, { type: "hint" });
    // Priya's role is already correct, so the next incomplete axis is Chen's role (person 1).
    expect(state.message).toContain("Chen");
    expect(state.marks[1]?.slice(0, 5)).toEqual(["no", "yes", "no", "no", "no"]);
  });

  it("targets a person's team once only their role (not yet their team) is correct", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "mark", person: 0, col: 0 }); // Priya's role, correctly, but no team yet
    state = engine.reduce(state, { type: "hint" });
    expect(state.message).toBe("Filled in Priya's team.");
    expect(state.marks[0]?.slice(5, 10)).toEqual(["no", "no", "no", "no", "yes"]);
  });

  it("hinting a cell locks it against further mark moves", () => {
    let state = makeState();
    state = engine.reduce(state, { type: "hint" });
    const next = engine.reduce(state, { type: "mark", person: 0, col: 1 });
    expect(next).toBe(state);
  });

  it("reports nothing left to hint once every axis is already correct", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    const next = engine.reduce(state, { type: "hint" });
    expect(next.message).toBe("Nothing left to hint.");
    expect(next.hintsUsed).toBe(state.hintsUsed);
  });

  it("does nothing once MAX_HINTS is reached", () => {
    let state = makeState();
    state = { ...state, hintsUsed: engine.MAX_HINTS };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("does nothing once the puzzle is done", () => {
    let state = makeState();
    state = { ...state, done: true };
    const next = engine.reduce(state, { type: "hint" });
    expect(next).toBe(state);
  });

  it("the standalone hint() matches reduce's hint move", () => {
    const state = makeState();
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("check/isDone/score", () => {
  it("the standalone check() matches reduce's check move (state half)", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    const viaReduce = engine.reduce(state, { type: "check" });
    const viaCheck = engine.check(state);
    expect(viaCheck.state).toEqual(viaReduce);
    expect(viaCheck.result.done).toBe(true);
  });

  it("isDone mirrors state.done", () => {
    const state = makeState();
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score reflects a win with checks-used-based points", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    state = engine.reduce(state, { type: "check" });
    const s = engine.score(state);
    expect(s.won).toBe(true);
    expect(s.points).toBe(engine.MAX_CHECKS);
    expect(s.checksUsed).toBe(1);
  });

  it("score reflects a loss with zero points", () => {
    const state: OrgState = { ...makeState(), done: true, won: false, checksUsed: engine.MAX_CHECKS };
    const s = engine.score(state);
    expect(s.won).toBe(false);
    expect(s.points).toBe(0);
  });
});

describe("canCheck", () => {
  it("is false until every person has a role yes and a team yes", () => {
    const state = makeState();
    expect(engine.canCheck(state)).toBe(false);
  });

  it("is true once the grid is full", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution) };
    expect(engine.canCheck(state)).toBe(true);
  });

  it("is false once the puzzle is done", () => {
    let state = makeState();
    state = { ...state, marks: correctMarks(state.puzzle.solution), done: true };
    expect(engine.canCheck(state)).toBe(false);
  });
});
