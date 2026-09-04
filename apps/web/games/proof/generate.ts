import { createRng, hashSeed, type Difficulty } from "@boardatwork/game-core";
import passagesJson from "@/content/proof.json" with { type: "json" };

export interface ProofPassage {
  id: string;
  seed: number;
  difficulty: Difficulty;
  words: readonly string[];
  /** Exactly 5 indices into `words`: the real, one-edit-away swapped-in words. */
  impostorIndices: readonly number[];
}

interface ProofContentEntry {
  id: string;
  words: readonly string[];
  impostorIndices: readonly number[];
  difficulty: Difficulty;
}

const PASSAGES = passagesJson as readonly ProofContentEntry[];

function poolFor(difficulty: Difficulty): readonly ProofContentEntry[] {
  const pool = PASSAGES.filter((p) => p.difficulty === difficulty);
  if (pool.length === 0) {
    throw new Error(`No Proof passages tagged "${difficulty}"`);
  }
  return pool;
}

export function dailySeed(dateKey: string): number {
  return hashSeed("proof", dateKey);
}

export function practiceSeed(counter: number): number {
  return hashSeed("proof", "practice", counter);
}

export function generate(seed: number, difficulty: Difficulty): ProofPassage {
  const rng = createRng(seed);
  const entry = rng.pick(poolFor(difficulty));
  return {
    id: entry.id,
    seed,
    difficulty,
    words: entry.words,
    impostorIndices: entry.impostorIndices,
  };
}
