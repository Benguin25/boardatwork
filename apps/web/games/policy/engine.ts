import type { CheckResult, Score } from "@boardatwork/game-core";
import { RULES } from "@boardatwork/rules";
import type { PolicyPuzzle } from "./generate";

export const MIN_PROBES_TO_GUESS = 5;
export const MAX_HINTS = 3;

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface ProbeRecord {
  word: string;
  satisfies: boolean;
}

export interface PolicyState {
  puzzle: PolicyPuzzle;
  probes: ProbeRecord[];
  /** Decoy ids removed from the candidate list by a hint (SPEC-style narrowing), kept out of the guess picker. */
  eliminatedIds: string[];
  hintsUsed: number;
  guessedRuleId: string | null;
  done: boolean;
  won: boolean;
  message: string;
  /** Probe/guess history, chat-log style (fits Policy's Slack home disguise). */
  log: LogEntry[];
  /** UI-only: whether the "guess the rule" picker is open. Not itself a `Move` outcome, but modelled as state (mirroring `_dev-placeholder`'s `modalOpen`) so `render` stays a pure function of `state`. */
  guessModalOpen: boolean;
}

export type PolicyMove =
  | { type: "probe"; word: string }
  | { type: "guess"; ruleId: string }
  | { type: "hint" }
  | { type: "toggle-guess-modal" };

function ruleById(id: string) {
  const rule = RULES.find((r) => r.id === id);
  if (!rule) {
    throw new Error(`Unknown rule id "${id}"`);
  }
  return rule;
}

export function init(puzzle: PolicyPuzzle): PolicyState {
  return {
    puzzle,
    probes: [],
    eliminatedIds: [],
    hintsUsed: 0,
    guessedRuleId: null,
    done: false,
    won: false,
    message: `Probe at least ${String(MIN_PROBES_TO_GUESS)} words, then guess the rule.`,
    guessModalOpen: false,
    log: puzzle.examples.map((word, i) => ({
      id: `example-${String(i)}`,
      author: "Host",
      text: `Here's one that fits: ${word}`,
    })),
  };
}

/** `canGuess` export, mirroring Braid's `canCheck` — gates the guess Action's `disabled` state in `render`. */
export function canGuess(state: PolicyState): boolean {
  return !state.done && state.probes.length >= MIN_PROBES_TO_GUESS;
}

function runProbe(state: PolicyState, word: string): PolicyState {
  const trueRule = ruleById(state.puzzle.trueRuleId);
  const clean = word.trim().toLowerCase();
  const satisfies = trueRule.test(clean);
  const probes = [...state.probes, { word: clean, satisfies }];
  const message = satisfies ? `"${clean}" fits the rule.` : `"${clean}" doesn't fit.`;
  return {
    ...state,
    probes,
    message,
    log: [
      ...state.log,
      {
        id: `probe-${String(probes.length)}`,
        author: "You",
        text: `${clean} — ${satisfies ? "✓ fits" : "✗ doesn't fit"}`,
      },
    ],
  };
}

/**
 * Resolves a guess as win/loss. Policy's move-log-replay requirement (SPEC:
 * "keep the engine's move log so it can be replayed server-side later")
 * means this, not a separate check step, is the move that can end the
 * puzzle — mirroring how Braid's `runCheck` is the thing that can end
 * *that* puzzle, even though the `Game.check(state)` method here means
 * something different (see below).
 */
function runGuess(state: PolicyState, ruleId: string): PolicyState {
  if (state.done || !canGuess(state)) {
    return state;
  }
  const won = ruleId === state.puzzle.trueRuleId;
  const guessedRule = ruleById(ruleId);
  const message = won
    ? `Correct! The rule was: ${guessedRule.description}`
    : `Not quite. You guessed "${guessedRule.description}" — the real rule was "${ruleById(state.puzzle.trueRuleId).description}".`;
  return {
    ...state,
    guessedRuleId: ruleId,
    done: true,
    won,
    message,
    guessModalOpen: false,
    log: [...state.log, { id: "guess", author: "You", text: message }],
  };
}

/** All example word lengths as a compact "3, 5, 5" style summary for the length-pattern hint fallback. */
function lengthPattern(examples: readonly string[]): string {
  return examples.map((w) => String(w.length)).join(", ");
}

function runHint(state: PolicyState): PolicyState {
  if (state.done || state.hintsUsed >= MAX_HINTS) {
    return state;
  }
  const hintsUsed = state.hintsUsed + 1;

  // Eliminate up to 2 wrong candidates per hint from the guessable list.
  const eliminable = state.puzzle.candidateIds.filter(
    (id) => id !== state.puzzle.trueRuleId && !state.eliminatedIds.includes(id),
  );
  const toEliminate = eliminable.slice(0, 2);

  if (toEliminate.length > 0) {
    const eliminatedIds = [...state.eliminatedIds, ...toEliminate];
    const message = `Hint: ruled out ${String(toEliminate.length)} wrong option${toEliminate.length === 1 ? "" : "s"} from the list.`;
    return {
      ...state,
      hintsUsed,
      eliminatedIds,
      message,
      log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: message }],
    };
  }

  // No wrong candidates left to eliminate: fall back to revealing the true
  // rule's example word lengths, a genuinely useful structural clue that
  // doesn't hand over the rule itself.
  const message = `Hint: the example words have lengths ${lengthPattern(state.puzzle.examples)}.`;
  return {
    ...state,
    hintsUsed,
    message,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: message }],
  };
}

export function reduce(state: PolicyState, move: PolicyMove): PolicyState {
  if (move.type === "toggle-guess-modal") {
    // Allowed even once the puzzle is done, so the results flow (which
    // reads `state` after a win/loss) never gets stuck with a move that's
    // silently ignored.
    return { ...state, guessModalOpen: !state.guessModalOpen };
  }
  if (state.done) {
    return state;
  }
  switch (move.type) {
    case "probe":
      return runProbe(state, move.word);
    case "guess":
      return runGuess(state, move.ruleId);
    case "hint":
      return runHint(state);
  }
}

/**
 * The `Game.check(state)` method Policy must export per the shared
 * interface. Unlike Braid, "check" doesn't map onto Policy's win condition
 * (guessing does) — so, per the task's guidance, `check` here evaluates the
 * *current* state's progress: how many probes have been made and whether
 * the player is ready to guess. It never itself ends the puzzle.
 */
export function check(state: PolicyState): { state: PolicyState; result: CheckResult } {
  const correctCount = Math.min(state.probes.length, MIN_PROBES_TO_GUESS);
  return {
    state,
    result: {
      correctCount,
      totalCount: MIN_PROBES_TO_GUESS,
      done: state.done,
    },
  };
}

export function hint(state: PolicyState): PolicyState {
  return runHint(state);
}

export function isDone(state: PolicyState): boolean {
  return state.done;
}

export function score(state: PolicyState): Score {
  const checksUsed = state.probes.length;
  return {
    // Fewer probes before a correct guess -> more points (SPEC: "fewer
    // probes = more points"), floored at 1 for any win.
    points: state.won ? Math.max(1, MIN_PROBES_TO_GUESS * 2 - checksUsed) : 0,
    maxPoints: MIN_PROBES_TO_GUESS * 2,
    checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.won,
  };
}
