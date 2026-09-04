import { createRng, hashSeed, weekdayOf, type Difficulty, type Rng } from "@boardatwork/game-core";
import wordSetsJson from "@/content/braid.json" with { type: "json" };

export interface BraidLetter {
  ch: string;
  src: number;
}

export interface BraidPuzzle {
  seed: number;
  difficulty: Difficulty;
  theme: string;
  words: readonly string[];
  letters: readonly BraidLetter[];
}

/** Content-pack tag: same as `Difficulty` plus "triple" for the Sunday 3-word sets (SPEC §2.1). */
export type BraidContentTag = Difficulty | "triple";

export interface BraidWordSet {
  theme: string;
  words: readonly string[];
  difficulty: BraidContentTag;
}

const WORD_SETS = wordSetsJson as readonly BraidWordSet[];

function poolFor(tag: BraidContentTag): readonly BraidWordSet[] {
  const pool = WORD_SETS.filter((w) => w.difficulty === tag);
  if (pool.length === 0) {
    throw new Error(`No Braid word sets tagged "${tag}"`);
  }
  return pool;
}

/** Weighted interleave with max run 2 from one word (SPEC §2.1), using remaining-letters weighting like the reference prototype. */
function braidInterleave(words: readonly string[], rng: Rng): BraidLetter[] {
  const ptr = words.map(() => 0);
  const out: BraidLetter[] = [];
  const total = words.reduce((sum, w) => sum + w.length, 0);

  while (out.length < total) {
    let live = words.map((_, i) => i).filter((i) => (ptr[i] as number) < (words[i]?.length as number));
    const n = out.length;
    if (n >= 2 && out[n - 1]?.src === out[n - 2]?.src && live.length > 1) {
      const lastSrc = out[n - 1]?.src;
      live = live.filter((i) => i !== lastSrc);
    }
    const idx = rng.weightedPick(
      live.map((i) => ({ value: i, weight: (words[i]?.length as number) - (ptr[i] as number) })),
    );
    const word = words[idx] as string;
    const p = ptr[idx] as number;
    out.push({ ch: word[p] as string, src: idx });
    ptr[idx] = p + 1;
  }
  return out;
}

/**
 * Encodes the daily seed as `hash(game, date) * 2 + tripleFlag`. Braid's
 * `generate` decodes the low bit to decide 2 vs 3 words — this keeps
 * `generate(seed, difficulty)` a pure function of its two arguments (no
 * date/weekday parameter exists on the shared `Game` interface) while
 * still guaranteeing the SPEC §2.1 "Sun 3-word" rule deterministically,
 * since only the daily scheduler (which knows the date) sets that bit.
 * Practice seeds always clear it, so practice is never accidentally
 * tripled by chance parity.
 */
export function dailySeed(dateKey: string): number {
  const base = hashSeed("braid", dateKey);
  const triple = weekdayOf(dateKey) === 0;
  return base * 2 + (triple ? 1 : 0);
}

export function practiceSeed(counter: number): number {
  return hashSeed("braid", "practice", counter) * 2;
}

export function generate(seed: number, difficulty: Difficulty): BraidPuzzle {
  const forceTriple = seed % 2 === 1;
  const rngSeed = Math.floor(seed / 2);
  const rng = createRng(rngSeed);
  const wordSet = rng.pick(poolFor(forceTriple ? "triple" : difficulty));
  const letters = braidInterleave(wordSet.words, rng);
  return { seed, difficulty, theme: wordSet.theme, words: wordSet.words, letters };
}
