# ADR-0006 — Work mode owns a `DisguiseId`, not a skin id

Status: accepted · Date: 2026-09-04

(The rebuild brief called this "ADR-0005"; that number was already taken by
the SPEC §6 open-questions record, so it lands here.)

## Context

Pressing `Esc` on a game page put the app in Work mode and then rendered
nothing but the word "Loading…", forever. There was no disguise picker, so
there was no way out except reloading.

## Root cause

Shell state kept one field, `skin: string`, and used it for two different
things: which skin renders the page, and which of the eight Work-mode
disguises the user has chosen (SPEC §3.1). The Play skin is in the same
registry as the disguises, and `DEFAULT_SETTINGS` in
`packages/game-core/src/storage/types.ts` seeds that field with `"play"`.

So on a device that had never picked a disguise:

1. `Esc` set `mode: "work"` and `covered: true` (SPEC §3.1: Work mode opens
   already covered).
2. `GamePageShell` resolved the active skin as `getSkin(settings.skin)` —
   `"play"` — and rendered `playSkin.Cover`.
3. The Play skin's `Cover` was a placeholder whose entire body was
   `<p>Loading…</p>`, with no visible way back.

Nothing was actually pending: no unresolved promise, no `dynamic()`
fallback, no empty Suspense boundary. The page had finished rendering
exactly what it was asked to render. `getSkin`'s "unknown id falls back to
play" guard made a corrupt persisted value land in the same dead end, so
the failure was reachable two ways.

## Decision

1. The eight disguises get their own type and module,
   `lib/disguises.ts`: `DISGUISE_IDS`, `DisguiseId`, `DEFAULT_DISGUISE =
   "docs"`, and `resolveDisguise(unknown)`, a Zod-validated boundary
   coercion. `"play"` is not a member.
2. Shell state carries `disguise: DisguiseId` (default `docs`), separate
   from which skin renders: Play mode always renders `playSkin`, Work mode
   always renders `getDisguise(disguise)`. Neither can resolve to the
   other.
3. Reads from `Storage` go through `resolveDisguise`, so the legacy
   `"play"` value, and anything else unrecognised, resolves to Docs
   instead of a blank page. `game-core`'s `Settings` schema is untouched —
   the app validates at its own boundary (CLAUDE.md).
4. The Play skin's `Cover` is real content with a labelled way back. It is
   unreachable in the shipped app (Play mode never covers) but is still
   exercised by `/dev/skins/play`.
5. A disguise picker ships: the shell header carries it in both modes, the
   Play skin's footer "Work mode" control opens it (choosing a disguise
   enters Work mode), and every Work chrome carries a "Change disguise"
   item in whatever passes for that app's settings menu.

## Consequences

- A skin id and a disguise id are different types; a disguise can never
  again be the Play skin.
- `Esc` from a fresh device lands in Docs, covered, with the title
  clickable to reveal the puzzle — no state can produce a blank page.
- One regression test per failure mode lives in
  `tests/e2e/work-mode.spec.ts`, including a pass over all eight
  disguises from the picker.
