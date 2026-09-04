/**
 * Deterministic RNG for puzzle generation. Every generator in this repo
 * must derive its randomness from a `Rng` created here — never
 * `Math.random()` — so the same seed always produces the same puzzle
 * (CLAUDE.md "Determinism").
 */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Next integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  /** Pick one element uniformly at random. */
  pick<T>(items: readonly T[]): T;
  /** Fisher-Yates shuffle; returns a new array, does not mutate the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** Pick one element with per-item weights (must be > 0, at least one item). */
  weightedPick<T>(items: readonly { value: T; weight: number }[]): T;
}

function xorshift32(state: number): number {
  let x = state;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

/** Creates a seeded, deterministic RNG. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) {
    // xorshift32 is fixed at zero; fall back to a non-zero constant.
    state = 0x9e3779b9;
  }

  function nextUint32(): number {
    state = xorshift32(state);
    return state;
  }

  const rng: Rng = {
    next(): number {
      return nextUint32() / 0x100000000;
    },
    nextInt(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError(
          `nextInt: maxExclusive must be a positive integer, got ${String(maxExclusive)}`,
        );
      }
      return Math.floor(rng.next() * maxExclusive);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new RangeError("pick: items must be non-empty");
      }
      const item = items[rng.nextInt(items.length)];
      // items.length > 0 and nextInt is bounded, so this index always exists.
      return item as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const result = items.slice();
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = rng.nextInt(i + 1);
        const a = result[i] as T;
        const b = result[j] as T;
        result[i] = b;
        result[j] = a;
      }
      return result;
    },
    weightedPick<T>(items: readonly { value: T; weight: number }[]): T {
      if (items.length === 0) {
        throw new RangeError("weightedPick: items must be non-empty");
      }
      const total = items.reduce((sum, item) => {
        if (item.weight <= 0) {
          throw new RangeError("weightedPick: every weight must be > 0");
        }
        return sum + item.weight;
      }, 0);
      let target = rng.next() * total;
      // Walk every item except the last, returning as soon as the running
      // total covers `target`; the last item is always the correct
      // fallback (its own weight brings the cumulative total to `total`,
      // and `target < total` always holds since `rng.next() < 1`), which
      // also sidesteps relying on an exact floating-point comparison.
      for (let i = 0; i < items.length - 1; i += 1) {
        const item = items[i] as { value: T; weight: number };
        target -= item.weight;
        if (target < 0) {
          return item.value;
        }
      }
      const last = items[items.length - 1] as { value: T; weight: number };
      return last.value;
    },
  };

  return rng;
}

/**
 * Deterministic 32-bit unsigned hash of arbitrary parts (FNV-1a), used to
 * derive a puzzle seed from e.g. `(game, date)` per SPEC §4.6.
 */
export function hashSeed(...parts: readonly (string | number)[]): number {
  const input = parts.join("|");
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
