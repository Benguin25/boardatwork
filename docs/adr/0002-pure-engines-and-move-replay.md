# ADR-0002: Pure engines and move-log replay

## Status
Accepted

## Context
SPEC §4.3 defines `Game<P, S, M>` with `generate`/`init`/`reduce`/`check`/
`hint`/`score` as pure functions over a puzzle `P`, state `S`, and move `M`,
so that "the server verifies results by replaying moves against the same
seed. No trust in client scores." CLAUDE.md requires game logic to live in
`games/*/engine.ts` and `packages/game-core` as pure functions with no React,
no DOM, no Supabase, and forbids any code path that would make server-side
replay verification impossible later.

## Decision
- Every game's `engine.ts` exports pure functions only: `generate(seed,
  difficulty)`, `init(puzzle)`, `reduce(state, move)`, `check(state)`,
  `hint(state)`, `isDone(state)`, `score(state)`, `shareGrid(state)`. None of
  them touch `Date.now()`, `Math.random()`, the DOM, or `Storage`.
- Every user interaction is dispatched as a `Move` (a discriminated union
  specific to the game) through `reduce`. `GameView.tsx` is the only place
  that turns a UI event into a `Move` and calls `dispatch`; it never mutates
  game state directly.
- `check`/`hint` results are derived from `state`, not from anything mutable
  outside it, so replaying the same move log against the same seed always
  reproduces the same state and the same `CheckResult`/`Score`.
- Randomness in generators uses only the seeded RNG in
  `packages/game-core/rng.ts` (`Math.random` is banned in engines and
  generators, enforced by code review and by generators never importing it).
- The web layer keeps a move log per session (in `Storage`, alongside the
  result) even though nothing server-side reads it yet in this local-only
  run — the log format is exactly what a future route handler would replay.

## Consequences
- Games are trivially unit-testable without React or a DOM.
- Server verification (SPEC §4.6 "Submit") can be added later purely as a
  route handler that imports the same `engine.ts` and replays the stored
  move log — no changes to game code.
- `GameView.tsx` cannot short-circuit game rules in the UI (e.g. optimistic
  "looks done" states not reflected in `state`), since the shell, hints,
  and share grid all read from `state` alone.
