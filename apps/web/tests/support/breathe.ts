/**
 * Hands the event loop back mid-sweep.
 *
 * The generators' SPEC §4.9 suites brute-force 1,000 seeds in one
 * synchronous loop, which blocks their Vitest worker long enough for the
 * worker's own `onTaskUpdate` RPC to time out and fail the run even though
 * every assertion passed. Yielding a macrotask every so often keeps the
 * worker responsive without changing what is verified.
 */
export function breathe(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** How often to yield inside a 1,000-seed sweep. */
export const BREATHE_EVERY = 50;
