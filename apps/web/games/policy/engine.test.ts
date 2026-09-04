import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { PolicyState } from "./engine";
import type { PolicyPuzzle } from "./generate";

/**
 * A hand-built fixture puzzle around the real "contains-y" rule (Contains
 * the letter Y), used by every test below for precise, non-flaky control
 * over probe/guess outcomes (per the task's guidance: small hand-built
 * fixtures rather than generated puzzles for engine tests).
 */
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

function withProbes(state: PolicyState, words: readonly string[]): PolicyState {
  return words.reduce((s, word) => engine.reduce(s, { type: "probe", word }), state);
}

describe("init", () => {
  it("logs the 3 starting examples from the Host and starts fresh", () => {
    const state = engine.init(fixturePuzzle());
    expect(state.log).toHaveLength(3);
    expect(state.log.every((entry) => entry.author === "Host")).toBe(true);
    expect(state.log[0]?.text).toContain("happy");
    expect(state.probes).toEqual([]);
    expect(state.eliminatedIds).toEqual([]);
    expect(state.hintsUsed).toBe(0);
    expect(state.guessedRuleId).toBeNull();
    expect(state.done).toBe(false);
    expect(state.won).toBe(false);
    expect(state.guessModalOpen).toBe(false);
  });
});

describe("canGuess", () => {
  it("is false before 5 probes", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system"]);
    expect(state.probes).toHaveLength(4);
    expect(engine.canGuess(state)).toBe(false);
  });

  it("is true once 5 probes have been made", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    expect(state.probes).toHaveLength(5);
    expect(engine.canGuess(state)).toBe(true);
  });

  it("is true with more than 5 probes too", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync", "gym"]);
    expect(engine.canGuess(state)).toBe(true);
  });

  it("is false once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(state.done).toBe(true);
    expect(engine.canGuess(state)).toBe(false);
  });
});

describe("reduce: probe", () => {
  it("records a fitting word as satisfying, with a matching message", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "probe", word: "story" });
    expect(state.probes).toEqual([{ word: "story", satisfies: true }]);
    expect(state.message).toBe('"story" fits the rule.');
    expect(state.log.at(-1)?.text).toContain("✓ fits");
  });

  it("records a non-fitting word as not satisfying, with a matching message", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "probe", word: "table" });
    expect(state.probes).toEqual([{ word: "table", satisfies: false }]);
    expect(state.message).toBe('"table" doesn\'t fit.');
    expect(state.log.at(-1)?.text).toContain("✗ doesn't fit");
  });

  it("normalizes casing and stray whitespace before testing and logging", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "probe", word: "  Story  " });
    expect(state.probes).toEqual([{ word: "story", satisfies: true }]);
  });

  it("allows unlimited probes (no cap)", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync", "gym", "onyx"]);
    expect(state.probes).toHaveLength(7);
  });

  it("is a no-op once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    const before = state;
    const next = engine.reduce(state, { type: "probe", word: "spy" });
    expect(next).toBe(before);
  });
});

describe("reduce: guess", () => {
  it("is a no-op before 5 probes have been made", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog"]);
    const before = state;
    const next = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(next).toBe(before);
    expect(next.done).toBe(false);
  });

  it("wins on a correct guess after 5 probes, closes the modal, and reveals the rule", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = { ...state, guessModalOpen: true };
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(state.done).toBe(true);
    expect(state.won).toBe(true);
    expect(state.guessedRuleId).toBe(TRUE_RULE_ID);
    expect(state.guessModalOpen).toBe(false);
    expect(state.message).toContain("Correct!");
    expect(state.message).toContain("Contains the letter Y");
  });

  it("loses on an incorrect guess after 5 probes, revealing both rules", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = engine.reduce(state, { type: "guess", ruleId: "palindrome" });
    expect(state.done).toBe(true);
    expect(state.won).toBe(false);
    expect(state.guessedRuleId).toBe("palindrome");
    expect(state.message).toContain("Not quite");
    expect(state.message).toContain("Is a palindrome");
    expect(state.message).toContain("Contains the letter Y");
  });

  it("is a one-shot: a second guess after a loss is a no-op", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = engine.reduce(state, { type: "guess", ruleId: "palindrome" });
    const before = state;
    const next = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(next).toBe(before);
  });

  it("throws for an unknown rule id", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    expect(() => engine.reduce(state, { type: "guess", ruleId: "not-a-real-rule" })).toThrow(
      /Unknown rule id/,
    );
  });
});

describe("reduce: hint", () => {
  it("eliminates up to 2 wrong candidates per hint", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.eliminatedIds).toHaveLength(2);
    expect(state.eliminatedIds.every((id) => id !== TRUE_RULE_ID)).toBe(true);
    expect(state.message).toContain("ruled out 2 wrong options");
  });

  it("never eliminates the true rule, across all hints", () => {
    let state = engine.init(fixturePuzzle());
    for (let i = 0; i < engine.MAX_HINTS; i += 1) {
      state = engine.reduce(state, { type: "hint" });
    }
    expect(state.eliminatedIds).not.toContain(TRUE_RULE_ID);
    expect(new Set(state.eliminatedIds).size).toBe(state.eliminatedIds.length);
  });

  it("uses singular phrasing when exactly 1 wrong candidate is eliminated", () => {
    let state = engine.init(fixturePuzzle());
    // Leave exactly 1 decoy un-eliminated so this hint can only remove 1.
    state = { ...state, eliminatedIds: DECOY_IDS.slice(0, 8) };
    state = engine.reduce(state, { type: "hint" });
    expect(state.eliminatedIds).toHaveLength(9);
    expect(state.message).toBe("Hint: ruled out 1 wrong option from the list.");
  });

  it("falls back to the example word-length pattern once no wrong candidates remain to eliminate", () => {
    let state = engine.init(fixturePuzzle());
    // Hand-craft a state where every decoy is already eliminated.
    state = { ...state, eliminatedIds: [...DECOY_IDS] };
    state = engine.reduce(state, { type: "hint" });
    expect(state.hintsUsed).toBe(1);
    expect(state.eliminatedIds).toEqual(DECOY_IDS);
    expect(state.message).toBe("Hint: the example words have lengths 5, 5, 6.");
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

  it("the standalone hint() matches reduce's hint move", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.hint(state)).toEqual(engine.reduce(state, { type: "hint" }));
  });
});

describe("reduce: toggle-guess-modal", () => {
  it("toggles guessModalOpen", () => {
    let state = engine.init(fixturePuzzle());
    state = engine.reduce(state, { type: "toggle-guess-modal" });
    expect(state.guessModalOpen).toBe(true);
    state = engine.reduce(state, { type: "toggle-guess-modal" });
    expect(state.guessModalOpen).toBe(false);
  });

  it("still works once the puzzle is done", () => {
    let state = engine.init(fixturePuzzle());
    state = { ...state, done: true };
    state = engine.reduce(state, { type: "toggle-guess-modal" });
    expect(state.guessModalOpen).toBe(true);
  });
});

describe("check/isDone/score", () => {
  it("check() reports probe progress toward the guess threshold without ending the puzzle", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog"]);
    const { state: next, result } = engine.check(state);
    expect(next).toBe(state);
    expect(result).toEqual({ correctCount: 2, totalCount: engine.MIN_PROBES_TO_GUESS, done: false });
  });

  it("check() caps correctCount at the guess threshold", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync", "gym", "onyx"]);
    const { result } = engine.check(state);
    expect(result.correctCount).toBe(engine.MIN_PROBES_TO_GUESS);
  });

  it("isDone mirrors state.done", () => {
    const state = engine.init(fixturePuzzle());
    expect(engine.isDone(state)).toBe(false);
    expect(engine.isDone({ ...state, done: true })).toBe(true);
  });

  it("score reflects a win with fewer-probes-scores-more", () => {
    let fast = engine.init(fixturePuzzle());
    fast = withProbes(fast, ["table", "dog", "cat", "system", "sync"]);
    fast = engine.reduce(fast, { type: "guess", ruleId: TRUE_RULE_ID });

    let slow = engine.init(fixturePuzzle());
    slow = withProbes(slow, ["table", "dog", "cat", "system", "sync", "gym", "onyx", "tray", "spy"]);
    slow = engine.reduce(slow, { type: "guess", ruleId: TRUE_RULE_ID });

    const fastScore = engine.score(fast);
    const slowScore = engine.score(slow);
    expect(fastScore.won).toBe(true);
    expect(slowScore.won).toBe(true);
    expect(fastScore.points).toBeGreaterThan(slowScore.points);
    expect(fastScore.checksUsed).toBe(5);
  });

  it("score floors a win's points at 1 no matter how many probes were used", () => {
    let state = engine.init(fixturePuzzle());
    const manyProbes = Array.from({ length: 30 }, (_, i) => `word${String(i)}`);
    state = withProbes(state, manyProbes);
    state = engine.reduce(state, { type: "guess", ruleId: TRUE_RULE_ID });
    expect(engine.score(state).points).toBe(1);
  });

  it("score reflects a loss with zero points", () => {
    let state = engine.init(fixturePuzzle());
    state = withProbes(state, ["table", "dog", "cat", "system", "sync"]);
    state = engine.reduce(state, { type: "guess", ruleId: "palindrome" });
    const s = engine.score(state);
    expect(s.won).toBe(false);
    expect(s.points).toBe(0);
  });
});
