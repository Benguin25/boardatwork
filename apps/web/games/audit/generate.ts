import { createRng, hashSeed, type Difficulty, type Rng } from "@boardatwork/game-core";

export const GRID_SIZE = 5;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const NODE_COUNT = GRID_SIZE * 2; // row nodes 0..4, column nodes 5..9

/** SPEC §2.2: easy=3, medium=4, hard=5 altered cells. */
const K_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

/** "True" cell values are drawn from [20, 75] so every displayed value (after a delta up to ±14) stays a positive, plausible two-digit-ish number. */
const TRUE_VALUE_MIN = 20;
const TRUE_VALUE_SPAN = 56;

/**
 * Candidate deltas for altered cells. Pairwise-distinct *values* (not just
 * magnitudes) are the load-bearing property here — see the uniqueness
 * argument on `buildCandidate` below.
 */
const DELTA_POOL: readonly number[] = [-14, -12, -11, -9, -8, -6, -5, -4, 4, 5, 6, 8, 9, 11, 12, 14];

export interface AuditPuzzle {
  seed: number;
  difficulty: Difficulty;
  /** Number of altered cells (3-5, by difficulty). */
  k: number;
  /** Row-major (length 25) "true" grid: every row/col total below is its exact sum. */
  trueGrid: readonly number[];
  /** Row-major (length 25) grid as shown to the player: differs from `trueGrid` at exactly the `k` `alteredCells`. */
  displayedGrid: readonly number[];
  /** The TRUE row sums, shown to the player unchanged. */
  rowTotals: readonly number[];
  /** The TRUE column sums, shown to the player unchanged. */
  colTotals: readonly number[];
  /** Row-major indices of the altered cells, ascending. Never shown to the player. */
  alteredCells: readonly number[];
}

function rowOf(index: number): number {
  return Math.floor(index / GRID_SIZE);
}

function colOf(index: number): number {
  return index % GRID_SIZE;
}

function cellIndex(row: number, col: number): number {
  return row * GRID_SIZE + col;
}

function sumRow(grid: readonly number[], row: number): number {
  let total = 0;
  for (let c = 0; c < GRID_SIZE; c += 1) {
    total += grid[cellIndex(row, c)] as number;
  }
  return total;
}

function sumCol(grid: readonly number[], col: number): number {
  let total = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    total += grid[cellIndex(r, col)] as number;
  }
  return total;
}

/**
 * Builds one candidate puzzle plus its row/column "defect" vectors (the
 * mismatch a player would compute: true total minus the actual sum of the
 * displayed row/column).
 *
 * Construction, and why it's uniquely solvable: exactly `k` distinct rows
 * and `k` distinct columns are chosen and paired 1:1, so every altered cell
 * is the *only* altered cell in both its row and its column. That pins
 * `rowDefect[r] = colDefect[c] = delta` for each altered `(r, c)` pair, and
 * every other row/column has zero defect. Because the `k` deltas are drawn
 * pairwise-distinct, the only way to pair up the `k` defective rows with
 * the `k` defective columns such that `rowDefect[r] == colDefect[c]` for
 * every pair is the true pairing — any other bijection would require two
 * *different* deltas to be equal. `isUniqueAlteration` below verifies this
 * programmatically rather than trusting the argument blindly.
 */
function buildCandidate(
  rng: Rng,
  seed: number,
  difficulty: Difficulty,
  k: number,
): { puzzle: AuditPuzzle; rowDefect: number[]; colDefect: number[] } {
  const trueGrid = Array.from({ length: CELL_COUNT }, () => TRUE_VALUE_MIN + rng.nextInt(TRUE_VALUE_SPAN));
  const rowTotals = Array.from({ length: GRID_SIZE }, (_, r) => sumRow(trueGrid, r));
  const colTotals = Array.from({ length: GRID_SIZE }, (_, c) => sumCol(trueGrid, c));

  const rows = rng.shuffle([0, 1, 2, 3, 4]).slice(0, k);
  const cols = rng.shuffle([0, 1, 2, 3, 4]).slice(0, k);
  const deltas = rng.shuffle(DELTA_POOL).slice(0, k);

  const displayedGrid = trueGrid.slice();
  const alteredCells: number[] = [];
  for (let i = 0; i < k; i += 1) {
    const idx = cellIndex(rows[i] as number, cols[i] as number);
    displayedGrid[idx] = (trueGrid[idx] as number) + (deltas[i] as number);
    alteredCells.push(idx);
  }
  alteredCells.sort((a, b) => a - b);

  const rowDefect = Array.from({ length: GRID_SIZE }, (_, r) => (rowTotals[r] as number) - sumRow(displayedGrid, r));
  const colDefect = Array.from({ length: GRID_SIZE }, (_, c) => (colTotals[c] as number) - sumCol(displayedGrid, c));

  const puzzle: AuditPuzzle = {
    seed,
    difficulty,
    k,
    trueGrid,
    displayedGrid,
    rowTotals,
    colTotals,
    alteredCells,
  };
  return { puzzle, rowDefect, colDefect };
}

/** Visits every size-`k` combination of `[0, n)`, depth-first, lowest index first. `visit` returns `false` to stop early. */
function forEachCombination(n: number, k: number, visit: (combo: readonly number[]) => boolean): void {
  const combo = new Array<number>(k).fill(0);

  function recurse(start: number, depth: number): boolean {
    if (depth === k) {
      return visit(combo);
    }
    for (let i = start; i <= n - (k - depth); i += 1) {
      combo[depth] = i;
      if (!recurse(i + 1, depth + 1)) {
        return false;
      }
    }
    return true;
  }

  recurse(0, 0);
}

/**
 * Brute-force uniqueness check (SPEC §2.2): true iff exactly one size-`k`
 * subset of the 25 cells could explain the observed `rowDefect`/`colDefect`
 * mismatch signature.
 *
 * A candidate subset `S` explains the signature iff:
 *  1. Every row/column NOT touched by `S` has zero defect (nothing untouched
 *     can be responsible for a nonzero mismatch).
 *  2. Within each connected component of the bipartite graph (row-nodes and
 *     column-nodes, joined by an edge per cell in `S`), the touched rows'
 *     defects sum to the touched columns' defects. This is exactly the one
 *     necessary-and-sufficient consistency condition for a connected
 *     bipartite incidence system (its rank is always `|component| - 1`,
 *     regardless of how many edges/cycles it has), so satisfying it is
 *     both necessary and *sufficient* for some real-valued assignment of
 *     "what the true values under S would have to be" to exist.
 *
 * All 25-choose-k combinations are enumerated (k ≤ 5 keeps C(25,5) = 53,130
 * trivial per SPEC), stopping as soon as a second valid explanation is
 * found.
 */
export function isUniqueAlteration(rowDefect: readonly number[], colDefect: readonly number[], k: number): boolean {
  const parent = new Array<number>(NODE_COUNT);
  const netByRoot = new Array<number>(NODE_COUNT);
  const touchedRow = new Array<boolean>(GRID_SIZE);
  const touchedCol = new Array<boolean>(GRID_SIZE);

  function find(start: number): number {
    let root = start;
    while ((parent[root] as number) !== root) {
      root = parent[root] as number;
    }
    return root;
  }

  function isValidExplanation(combo: readonly number[]): boolean {
    for (let i = 0; i < GRID_SIZE; i += 1) {
      touchedRow[i] = false;
      touchedCol[i] = false;
    }
    for (let i = 0; i < k; i += 1) {
      const idx = combo[i] as number;
      touchedRow[rowOf(idx)] = true;
      touchedCol[colOf(idx)] = true;
    }
    for (let r = 0; r < GRID_SIZE; r += 1) {
      if (!touchedRow[r] && rowDefect[r] !== 0) {
        return false;
      }
    }
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (!touchedCol[c] && colDefect[c] !== 0) {
        return false;
      }
    }

    for (let i = 0; i < NODE_COUNT; i += 1) {
      parent[i] = i;
      netByRoot[i] = 0;
    }
    for (let i = 0; i < k; i += 1) {
      const idx = combo[i] as number;
      const a = find(rowOf(idx));
      const b = find(GRID_SIZE + colOf(idx));
      if (a !== b) {
        parent[a] = b;
      }
    }
    for (let r = 0; r < GRID_SIZE; r += 1) {
      if (touchedRow[r]) {
        const root = find(r);
        netByRoot[root] = (netByRoot[root] as number) + (rowDefect[r] as number);
      }
    }
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (touchedCol[c]) {
        const root = find(GRID_SIZE + c);
        netByRoot[root] = (netByRoot[root] as number) - (colDefect[c] as number);
      }
    }
    for (let n = 0; n < NODE_COUNT; n += 1) {
      if (netByRoot[n] !== 0) {
        return false;
      }
    }
    return true;
  }

  let validCount = 0;
  forEachCombination(CELL_COUNT, k, (combo) => {
    if (isValidExplanation(combo)) {
      validCount += 1;
      if (validCount > 1) {
        return false; // ambiguous already proven; no need to keep searching
      }
    }
    return true;
  });
  return validCount === 1;
}

const MAX_GENERATE_ATTEMPTS = 8;

/**
 * `generate(seed, difficulty)` is a pure function of its two arguments
 * (CLAUDE.md "Determinism"). The construction in `buildCandidate` is proven
 * unique by design, so `isUniqueAlteration` is expected to pass on the
 * first attempt; the retry loop is a defensive backstop (deterministically
 * derived from `seed`, never `Math.random()`) rather than an assumption
 * that ambiguity is normal.
 */
export function generate(seed: number, difficulty: Difficulty): AuditPuzzle {
  const k = K_BY_DIFFICULTY[difficulty];
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
    const rngSeed = attempt === 0 ? seed : hashSeed(seed, "audit-retry", attempt);
    const rng = createRng(rngSeed);
    const { puzzle, rowDefect, colDefect } = buildCandidate(rng, seed, difficulty, k);
    if (isUniqueAlteration(rowDefect, colDefect, k)) {
      return puzzle;
    }
  }
  throw new Error(
    `Audit generator could not find a uniquely-solvable ${difficulty} puzzle for seed ${String(seed)} after ${String(MAX_GENERATE_ATTEMPTS)} attempts`,
  );
}

export function dailySeed(dateKey: string): number {
  return hashSeed("audit", dateKey);
}

export function practiceSeed(counter: number): number {
  return hashSeed("audit", "practice", counter);
}
