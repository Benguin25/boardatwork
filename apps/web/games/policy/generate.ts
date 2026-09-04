import { createRng, hashSeed, type Difficulty } from "@boardatwork/game-core";
import { pickDecoyRules, RULES } from "@boardatwork/rules";

export const CANDIDATE_COUNT = 10;
export const DECOY_COUNT = CANDIDATE_COUNT - 1;
export const EXAMPLE_COUNT = 3;
/**
 * How many tappable "probe" word chips `GameView` offers (see its own
 * comment for why probing is chip-based rather than free text). Large
 * enough that a player can comfortably make >= `MIN_PROBES_TO_GUESS`
 * distinct probes.
 */
export const PROBE_CANDIDATE_COUNT = 16;

export interface PolicyPuzzle {
  seed: number;
  difficulty: Difficulty;
  /** The hidden rule players are trying to identify. */
  trueRuleId: string;
  /** 3 words the "host" (the app) offers up front, all satisfying the true rule. */
  examples: readonly string[];
  /**
   * The 10 guessable rule ids (the true rule + 9 decoys), pre-shuffled with
   * the puzzle's own seeded `Rng` so the true rule's position is stable for
   * a given seed but not predictable from it.
   */
  candidateIds: readonly string[];
  /** Deterministic pool of tappable probe words offered by `GameView` (a mix of fits/doesn't-fit, not pre-labelled). */
  probeCandidates: readonly string[];
}

/**
 * A small pool of plain, original, generic English words (no proper nouns,
 * no copyrighted text) curated so that every rule in `@boardatwork/rules`
 * has at least 3 satisfying words in it — proven by
 * `generate.test.ts`'s "every rule has 3 valid examples" loop over all
 * rules. Kept local to Policy rather than reusing Braid's theme-paired word
 * sets, since Policy needs single words filterable by arbitrary predicates,
 * not theme pairs.
 */
export const WORD_POOL: readonly string[] = [
  "alien", "almost", "apple", "area", "arena", "audio", "banana", "beacon",
  "bear", "beautiful", "blue", "brave", "cab", "cage", "cake", "camel",
  "cart", "carts", "cat", "cats", "chair", "cheese", "civic", "cloud",
  "coat", "crypt", "dinosaur", "dog", "education", "elephant", "equation",
  "exact", "flask", "fox", "frog", "gala", "gamble", "garden", "glass",
  "glyph", "gold", "great", "gym", "happy", "hi", "hill", "house", "idea",
  "image", "into", "jump", "kitten", "letter", "level", "lion", "lynx",
  "melon", "milk", "monkey", "moon", "mountain", "myth", "noon", "nymph",
  "ocean", "onyx", "open", "orange", "party", "picture", "pizza", "planet",
  "plant", "poll", "pottery", "puny", "puppy", "putty", "quick", "quiz",
  "radar", "refer", "rhythm", "run", "salad", "sequoia", "seven", "size",
  "smile", "splash", "sponged", "spoon", "spring", "stats", "story",
  "string", "strong", "summer", "sunny", "sweater", "sync", "system",
  "table", "tenet", "train", "tree", "trollop", "trust", "tryst", "under",
  "vast", "water", "world", "wronged", "yellow", "zebra",
] as const;

/**
 * Rule ids grouped by how subtle they are to detect from a handful of
 * probes, hand-tagged (not part of `Rule` itself, since the shared shape
 * per the task's spec is just `{id, description, test}`). Harder
 * difficulties draw the true rule from the subtler tier; every rule in
 * `@boardatwork/rules` appears in exactly one tier (checked by
 * `generate.test.ts`).
 */
export const EASY_RULE_IDS: readonly string[] = [
  "double-letter", "same-first-last", "double-vowel", "double-consonant",
  "contains-q-or-z", "palindrome", "even-length", "odd-length",
  "starts-vowel-ends-consonant", "starts-consonant-ends-vowel", "long-word",
  "short-word", "no-vowels", "contains-no-e", "ends-with-e", "contains-y",
  "no-double-letters",
];

export const MEDIUM_RULE_IDS: readonly string[] = [
  "all-five-vowels", "isogram", "more-consonants-than-vowels",
  "no-letter-more-than-twice", "three-distinct-vowels",
  "has-second-half-letter", "prime-length", "multiple-of-three-length",
  "square-length", "exactly-one-vowel", "exactly-two-vowels",
  "consonant-cluster", "vowel-heavy",
];

export const HARD_RULE_IDS: readonly string[] = [
  "no-vowels-except-e", "alphabetical-order", "reverse-alphabetical-order",
  "first-half-alphabet", "second-half-alphabet", "first-before-last",
  "left-hand-only", "right-hand-only", "top-row-only", "home-row-only",
  "second-letter-vowel", "second-last-letter-vowel", "more-unique-than-repeated",
];

function tierRuleIds(difficulty: Difficulty): readonly string[] {
  if (difficulty === "easy") {
    return EASY_RULE_IDS;
  }
  if (difficulty === "medium") {
    return MEDIUM_RULE_IDS;
  }
  return HARD_RULE_IDS;
}

function ruleById(id: string) {
  const rule = RULES.find((r) => r.id === id);
  if (!rule) {
    throw new Error(`Unknown rule id "${id}"`);
  }
  return rule;
}

export function dailySeed(dateKey: string): number {
  return hashSeed("policy", dateKey);
}

export function practiceSeed(counter: number): number {
  return hashSeed("policy", "practice", counter);
}

export function generate(seed: number, difficulty: Difficulty): PolicyPuzzle {
  const rng = createRng(seed);
  const trueRuleId = rng.pick(tierRuleIds(difficulty));
  const trueRule = ruleById(trueRuleId);

  const matching = WORD_POOL.filter((word) => trueRule.test(word));
  if (matching.length < EXAMPLE_COUNT) {
    // Guarded by generate.test.ts looping over every rule in RULES; kept as
    // a hard failure rather than a silent shortfall so a future rule/word
    // pool change that breaks this invariant fails loudly.
    throw new Error(`Word pool has fewer than ${String(EXAMPLE_COUNT)} matches for rule "${trueRuleId}"`);
  }
  const examples = rng.shuffle(matching).slice(0, EXAMPLE_COUNT);

  const decoys = pickDecoyRules(trueRuleId, rng, DECOY_COUNT);
  const candidateIds = rng.shuffle([trueRuleId, ...decoys.map((r) => r.id)]);

  const remainingPool = WORD_POOL.filter((word) => !examples.includes(word));
  const probeCandidates = rng.shuffle(remainingPool).slice(0, PROBE_CANDIDATE_COUNT);

  return { seed, difficulty, trueRuleId, examples, candidateIds, probeCandidates };
}
