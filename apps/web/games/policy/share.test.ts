import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { PolicyPuzzle } from "./generate";
import { shareGrid } from "./share";

const TRUE_RULE_ID = "contains-y";
const DECOY_IDS = [
  "double-letter",
  "palindrome",
  "contains-q-or-z",
  "isogram",
  "long-word",
  "short-word",
  "even-length",
  "odd-length",
  "no-vowels",
];

function fixturePuzzle(): PolicyPuzzle {
  return {
    seed: 0,
    difficulty: "easy",
    trueRuleId: TRUE_RULE_ID,
    examples: ["happy", "party", "yellow"],
    candidateIds: [TRUE_RULE_ID, ...DECOY_IDS],
    probeCandidates: ["table", "dog", "cat", "system", "sync", "gym", "story", "onyx", "tray", "spy"],
  };
}

describe("shareGrid", () => {
  it("shows the probe count and a green square for a win, revealing nothing about the rule", () => {
    let state = engine.init(fixturePuzzle());
    for (const word of ["table", "dog", "cat", "system", "sync"]) {
      state = engine.reduce(state, { type: "probe", word });
    }
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    const text = shareGrid(state);
    expect(text).toBe(`Policy 5 probes\n\n🟩`);
    expect(text).not.toContain("Contains the letter Y");
    expect(text.toLowerCase()).not.toContain(TRUE_RULE_ID);
  });

  it("shows X and a black square for a loss, plus a footer, revealing nothing about the rule", () => {
    let state = engine.init(fixturePuzzle());
    for (const word of ["table", "dog", "cat", "system", "sync"]) {
      state = engine.reduce(state, { type: "probe", word });
    }
    state = engine.reduce(state, { type: "guess", ruleId: "palindrome" });
    const text = shareGrid(state);
    expect(text).toContain("Policy X probe");
    expect(text).toContain("⬛");
    expect(text).toContain("Needed 5+ probes to guess.");
    expect(text).not.toContain("Contains the letter Y");
  });

  it("appends a 💡 per hint used", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    for (const word of ["table", "dog", "cat", "system", "sync"]) {
      state = engine.reduce(state, { type: "probe", word });
    }
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(shareGrid(state).split("\n")[0]).toBe("Policy 5 probes 💡");
  });

  it("uses singular phrasing for exactly one probe", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "probe", word: "table" });
    // Won't legally reach a win with 1 probe (canGuess needs 5), so build
    // the header directly off a hand-crafted done+won state to exercise
    // the singular branch.
    state = { ...state, done: true, won: true };
    expect(shareGrid(state).split("\n")[0]).toBe("Policy 1 probe");
  });
});
