# Board at Work

Daily puzzle games that look like work. Six original puzzles (Braid, Audit,
Proof, Forecast, Org, Policy), a clean **Play** skin, and nine **Work**
disguises (Google Docs, Sheets, Slides, Slack, Jira, Outlook, Notion,
Terminal) that render the exact same puzzle so it can sit on a monitor in
an open office. See [`docs/SPEC.md`](docs/SPEC.md) for the full product
and technical spec, and [`docs/adr/`](docs/adr) for the decisions made
along the way.

This build is **local-only**: no database, no auth, no deployment, no CI.
See "What's deferred" below.

## Setup

1. `npm install`
2. `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)
4. Play a daily puzzle in the Play skin, then press `Esc` to flip into
   Work mode (it opens already covered — click the title to reveal the
   puzzle) and pick a disguise from the header.
5. Optional — validate everything the way CI would if this had CI:
   `npm run check && npm run e2e`

## Commands

```
npm run dev             # web app (apps/web), http://localhost:3000
npm run build            # production build
npm run start             # serve the production build
npm run check            # typecheck + lint + unit tests + content validation
npm run e2e              # Playwright (all six games × all nine skins)
npm run content:check    # validate content packs (content/*.json) against their Zod schemas
```

Each command in `check`/`e2e` can also be run per-workspace, e.g.
`npm run test -w apps/web` or `cd apps/web && npx playwright test`.

## Repo layout

```
apps/web/            Next.js 15 app (App Router, React 19, TS strict, Tailwind v4)
  app/                routes: /, /[game], /[game]/practice, /[game]/p/[code], /[game]/archive/[date]
  components/shell/   header, mode toggle, disguise picker, GamePageShell (shared game host)
  components/primitives/  SkinPrimitives interface — the only thing a game may render through
  skins/              play/, docs/, sheets/, slides/, slack/, jira/, outlook/, notion/, terminal/
  games/              one folder per game: engine.ts, generate.ts, GameView.tsx, share.ts, index.tsx
  lib/                storage adapters, dates, favicon, content schemas
  content/            JSON content packs, Zod-validated by npm run content:check
packages/
  game-core/          Game interface, seeded RNG, dates, share-grid, challenge codes, Storage (framework-free)
  rules/              Policy's 43 rule predicates + decoy generator (framework-free)
docs/                 SPEC.md, ADRs (docs/adr/NNNN-*.md)
```

## What's deferred

This run intentionally skips everything in SPEC that needs a backend.
Nothing built here assumes it will never exist — the seams below are
exactly where each piece plugs back in.

| Deferred (SPEC §) | Seam it plugs into |
|---|---|
| Supabase / Postgres, anonymous + signed-in identity (§3.2, §4.5) | `Storage` interface (`packages/game-core/storage`) — swap `LocalStorageAdapter` for a Supabase-backed adapter; no game or skin code changes |
| Friends, leaderboards, cross-device stats (§3.3, §3.4) | Same `Storage` seam, plus the already-present `results`-shaped data (`GameResult`, `GameStats`) the local adapter already produces |
| Server-verified results (§4.6 "Submit") | Every game's move log (ADR-0002) is exactly what a route handler would replay against `engine.reduce`/`check` to verify a score — the client already keeps and replays this log (see `useGameSession.ts`) |
| Signed challenge links (§4.6) | `packages/game-core/challenge-code.ts` exports `identitySign`/`identityVerify` as explicit no-op stubs shaped like the real HMAC functions that would replace them |
| Async Policy (probes/guesses via friends, §2.5) | Policy's engine already logs every probe/guess as a move; async play needs a `policy_games`/`policy_probes` backend and a turn-based UI, not an engine change |
| CI, deploy, monetization hooks, PWA, OG images (§3.5, §4.9, milestones M2-M4) | Not started — no code depends on their absence |

## Verifying it yourself

`npm run check` runs typecheck, lint (ESLint 9 + `jsx-a11y` as errors),
451 unit tests (100% statement/line/function coverage on every game's pure
engine — `generate`/`reduce`/`check`/`hint`/`score` — plus `packages/game-core`
and `packages/rules`), and content-pack validation. `npm run e2e` runs 66
Playwright tests: each game solved end-to-end in the Play skin and in its
"home" disguise, and axe-core-clean smoke renders in the other seven
disguises, plus the shell (mode toggle, disguise picker) and skin-parity
suites.
