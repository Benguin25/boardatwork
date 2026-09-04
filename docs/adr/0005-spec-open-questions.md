# ADR-0005: SPEC §6 open questions, decided for this local-only run

## Status
Accepted

## Context
SPEC §6 lists three open questions to "decide during M0, record as ADRs."
This run has no backend (ADR-0001), so two of the three are more "how do
we not paint ourselves into a corner" than "how do we implement it now."

## Decisions

**1. Local-midnight rollover.** SPEC leans toward "puzzles keyed by
calendar date; leaderboard for a date closes 36h after the earliest
midnight." We adopt the first half now: `localDateKey()`
(`packages/game-core/dates.ts`) always uses the browser's local calendar
date, so a daily puzzle rolls over at local midnight per SPEC's language,
and `seed = hashSeed(game, dateKey)` per SPEC §4.6. The 36h leaderboard
close-window is not implemented — there are no leaderboards yet
(SPEC §3.3, deferred, see ADR-0001) — but nothing about the date-key
scheme forecloses it: a future leaderboard-closing job just needs to
compare the row's `dateKey` against `now` in the leaderboard's own
timezone policy, independent of how any individual client computed its
`dateKey`.

**2. Anonymous → signed-in merge across devices.** Out of scope: this run
has no identity at all (ADR-0001), anonymous or otherwise — `Storage` is
a single local-device store. Deferred along with the rest of SPEC
§3.2, with the same seam: the `Storage` interface (ADR-0004) is the only
thing a future identity layer needs to reimplement (a
`SupabaseStorageAdapter` that reads/writes `results` by user id instead
of by device), so this decision doesn't need to be made now — it isn't
blocked by anything built in this run.

**3. Forecast retry-per-question.** SPEC §2.4's own body text already
answers this ("No checks; one submission per question"); §6 just flags it
as reconsiderable. We keep the simpler, already-specified behavior — one
submission per question, no retry, no `checks` concept for this game
(`Forecast`'s `Score.checksUsed` is always 0) — per CLAUDE.md's "if SPEC
is silent or ambiguous, choose the simplest option consistent with
CLAUDE.md... and continue." Revisiting this later is additive (a `checks`
concept could be layered onto `ForecastState` without touching the shell
or other games).

## Consequences
- No code in this run assumes a specific leaderboard-closing policy or a
  specific identity-merge strategy; both are additive later work behind
  `Storage`.
- Forecast ships exactly as SPEC §2.4 describes it today; a retry mode
  would be a new, explicit engine change, not a config flag threaded
  through the shell.
