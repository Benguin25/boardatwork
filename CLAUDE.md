# CLAUDE.md — working agreement for this repo

You are building **Board at Work** (see `docs/SPEC.md`, the source of truth). Read the spec section relevant to your task before starting. If the spec is silent or ambiguous, stop and ask; do not guess.

## Ground rules
- **No technical debt by default.** If you're tempted to write a TODO, write the code instead or open an issue with a concrete plan. No `any`, no `@ts-ignore`, no skipped tests, no commented-out code.
- **Pure engines.** Game logic lives in `games/*/engine.ts` and `packages/game-core` as pure functions with no React, no DOM, no Supabase. Everything a user does is a `Move`; the server replays moves to verify.
- **Games never know about skins.** Render through `SkinPrimitives` only. If a game needs a new primitive, add it to the interface and implement it in every skin.
- **Determinism.** All generation uses the seeded RNG in `packages/game-core/rng.ts`. Never `Math.random()` in engines or generators.
- **Validate at boundaries.** Zod for URL params, content packs, storage reads, and env vars. Trust nothing from outside the engine.
- **Storage goes through `Storage`.** No direct `localStorage`, `fetch`, or Supabase calls anywhere except adapters in `lib/storage/`. The current adapter is local; a Supabase adapter comes later.
- **Original content only.** No copyrighted text, lyrics, or trademarked characters in content packs or fixtures. Trivia questions need a source URL.
- **Accessibility is not optional.** Keyboard, labels, live regions, reduced motion. `eslint-plugin-jsx-a11y` errors block commits.

## Workflow
1. Plan: restate the task in 3–6 bullets, list files you'll touch. For anything touching schema, skins, or `Game` interface, write an ADR in `docs/adr/` first.
2. Tests first for engines and rules (Vitest). UI gets a Playwright test when it completes a user flow.
3. Implement. Small commits, conventional messages (`feat(braid): …`, `fix(shell): …`).
4. Run `npm run check` (typecheck + lint + unit + content) before declaring done. For UI, also `npm run e2e`. (No CI yet; these are the gate.)
5. Report: what changed, how to verify, anything you'd flag for review.

## Commands
```
npm run dev             # web app
npm run check           # typecheck + lint + unit tests + content validation
npm run e2e             # playwright
npm run content:check   # validate content packs
```

## Environment
- **npm only.** Use npm workspaces and `package-lock.json`. Never introduce pnpm or yarn files or commands.
- Pin `jsdom` to `^29.1.1` in every package that uses it (jsdom 30 breaks the Vitest setup on this machine). Do not upgrade it.

## Conventions
- TypeScript strict; prefer discriminated unions over booleans; `readonly` where possible.
- Files: kebab-case; components PascalCase; one component per file.
- Tailwind for layout; skin tokens as CSS variables set on the skin root (`--tile-bg`, `--accent-a` …). No hard-coded colours inside game views.
- Server components by default; `"use client"` only where interaction requires.
- Dates: store `YYYY-MM-DD` puzzle dates; never store local Date objects. Use `lib/dates.ts`.
- Errors: throw typed errors from `lib/errors.ts`; route handlers map to HTTP codes in one place.
- Analytics: only via `lib/analytics.ts` with named events from `analytics/events.ts`.

## Definition of done for a game
- `engine.ts` + `generate.ts` fully unit-tested incl. uniqueness/solvability of generated puzzles across 1,000 seeds.
- `GameView.tsx` renders in the Play skin and at least one Work skin with no skin-specific code.
- Share grid, hint, check, practice, challenge link all work.
- Content pack validated; difficulty tagging present.
- Playwright: complete a daily in both skins.
- Entry in `games/registry.ts` and the home list.

## Things to never do
- Write code that would make server-side replay verification impossible later (e.g. non-logged state mutations).
- Add a dependency without a one-line justification in the PR description.
- Rewrite a skin's primitives to special-case one game.
