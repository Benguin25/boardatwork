# Board at Work — Product & Technical Spec

> Daily puzzle games that look like work. Every game has two skins: a clean **Play** skin and a **Work** skin that disguises it as a productivity app so it can sit on a monitor in an open office.

---

## 1. Product

### 1.1 One-liner
A collection of original, 2–5 minute daily puzzles (word, number, trivia, social) with a shared account, streaks, friends, and a "boss key" that swaps the whole page into a fake Google Doc / Sheet / Slack / Jira / inbox.

### 1.2 Principles
1. **Original mechanics.** No Wordle/Connections clones. Every game must pass the test: "could I describe the core loop without referencing an existing game?"
2. **Simple loop, real difficulty.** One interaction type per game (tap, drag, type). Difficulty comes from the puzzle, not the UI.
3. **The disguise is a first-class feature, not a theme.** Every game renders through abstract primitives so any disguise can display it convincingly.
4. **Shareable by default.** Every result produces a spoiler-free emoji grid and a challenge link.
5. **Sustainable.** Deterministic puzzle generation, server-verified scores, typed end to end, tested. No shortcuts that we'd have to undo.

### 1.3 Audience
Anyone on the internet, 18–40, office workers and students. Desktop-first for the disguise, fully playable on mobile.

### 1.4 Non-goals (v1)
Real-time multiplayer, native apps, ads, payments (hooks only), user-generated puzzle marketplace.

---

## 2. Games

Each game is a self-contained module implementing the `Game` interface (§4.3). Difficulty knobs and hint behavior are standardized so the shell can treat games uniformly.

Shared rules unless a game overrides:
- **Checks:** 5 per puzzle. **Hints:** 3 per puzzle, shown as 💡 on the share grid.
- **Daily:** one puzzle per game per day, rolls over at **local midnight**. Practice mode serves unlimited seeded puzzles that don't affect stats.
- **Share grid:** one line per check, emoji-only, no letters.

### 2.1 Braid (word) — ported from prototype
Two or three words are interleaved into one string; each word keeps its own letter order. Tap letters to colour them into strands. Each check reports how many letters are on the wrong strand and locks one. Theme is hidden until check 2. Hint 1 reveals the theme; later hints lock a letter.
- Generator: weighted interleave, max run of 2 from one word, seeded. Word pairs chosen to share letters (see `content/braid.json`, ≥200 pairs, tagged by difficulty).
- Difficulty: word length, shared-letter count, 2 vs 3 words. Weekday schedule: Mon–Wed easy/medium, Thu–Sat hard, Sun 3-word.
- Work disguise mapping: letters = highlighted text run; strands = bulleted list; checks = comment thread.

### 2.2 Audit (number/logic)
A 5×5 grid of numbers with row and column totals shown. Exactly *k* cells (3–5) have been altered so the totals no longer reconcile. Find the altered cells. Tap to flag; check tells you how many flags are correct (not which). Hints reveal one altered cell.
- Generator: build a consistent grid, then perturb k cells such that the solution is unique (verify by brute force over C(25,k); k ≤ 5 keeps this fast).
- Work disguise: it literally *is* a spreadsheet. Play skin: clean grid with totals in the margins.

### 2.3 Proof (word)
A short passage (60–90 words) in which 5 words have been replaced by a real word one edit away (`cat → cot`, `there → three`). Tap the 5 impostors. Check tells you how many of your flags are correct. Hints reveal one.
- Content: `content/proof/*.json` passages (original, written for the game; no copyrighted text) + edit-distance-1 dictionary swaps that must produce a valid, grammatically plausible word. Passages are pre-generated and reviewed, not live-generated.
- Work disguise: a Doc in "Suggesting" mode. Play skin: paragraph with tappable words.

### 2.4 Forecast (trivia / estimation)
Five numeric estimation questions ("How many keys on a full-size piano?", "Year the first email was sent"). Slider or typed answer. Score per question by log-error bands: within 5% = 3, 15% = 2, 40% = 1, else 0. Max 15. No checks; one submission per question. Hint narrows the range by 50%.
- Content: `content/forecast.json`, ≥500 questions with source URL, unit, and accepted range.
- Work disguise: a Sheets "projections" tab or a form. Play skin: one question at a time with a range slider.

### 2.5 Policy (social, async)
One player picks a hidden **rule** from the rule library (e.g., "contains a double letter", "letters in alphabetical order", "no vowels except E", "can be typed with left hand only") and provides 3 example words. Friends submit words and get ✓/✗ instantly (server-evaluated). After ≥5 probes, a guesser may pick the rule from a shortlist of 10 candidates the server generates (true rule + 9 decoys). Fewer probes = more points.
- Turn-based via DB rows; no realtime needed. Notifications v2.
- Rule library: ≥40 rules implemented as pure predicate functions with tests.
- Work disguise: a "policy document" with an approvals list. Play skin: chat-like probe log.

### 2.6 Org (logic)
Five people, five roles, five teams (or floors). 5–7 clues ("Priya reports to whoever runs Design", "The person on floor 3 is not in Finance"). Fill the grid by tapping; check tells you how many cells are correct; hints fill one cell. Generator produces a random assignment, then samples clues from templates until the solution is unique (brute-force over 5!³ is fast); prune redundant clues.
- Work disguise: an org chart in Slides or a Notion database. Play skin: three-way logic grid.

### 2.7 Backlog (post-launch)
Standup (order 6 events by time), Merge (portmanteau split), Redline v2 (multi-error).

---

## 3. Features

### 3.1 Shell
- Home: today's puzzles as a list, each with status (unplayed / in progress / done + score).
- Game page: `/[game]` (daily), `/[game]/practice`, `/[game]/p/[code]` (challenge link), `/[game]/archive/[date]` (signed-in only, monetization hook).
- Global **mode toggle**: Play ↔ Work. Keyboard: `Esc` toggles. In Work mode, clicking the document title flips to a "cover" state (plain fake content); `Esc` returns to Play. Mode persists per device.
- Disguise picker (Work mode settings): Google Docs, Google Sheets, Google Slides, Slack, Jira board, Outlook inbox, Notion page, Terminal. **All eight ship at launch** and every game must be playable in every disguise (via primitives; a skin may choose a different primitive layout per game category but never game-specific code).
- Tab title + favicon follow the disguise.

### 3.2 Identity
- Anonymous by default: device gets a signed anonymous Supabase session; nickname stored locally and in `profiles`.
- Sign in (magic link or Google) upgrades the anonymous user in place (Supabase anonymous → linked identity) so history is preserved.
- Signed-in gets: cross-device streaks, friends, leaderboards, archive.

### 3.3 Social
- Share result (emoji grid) and challenge link from every results screen.
- Challenge link encodes puzzle id + sender + sender's result; opening it shows "Zach cleared this in 3/5".
- Friends: add by username or link; friend leaderboard per game per day and rolling 7-day.
- Global daily leaderboard per game (top 100, ties by time).

### 3.4 Stats
Per game: played, win %, current streak, best streak, distribution of checks used. Stored server-side for signed-in users; mirrored in localStorage for anonymous.

### 3.5 Monetization hooks (no UI at launch)
- `entitlements` table + `useEntitlement(key)` hook; gated features read from it: `archive`, `extra_hints`, `premium_disguises`.
- Feature flags via a `flags` table with server + client readers.
- No payment provider integration in v1; leave a `billing/` module stub with a `Provider` interface.

---

## 4. Architecture

### 4.1 Stack
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict | Requested; RSC for puzzle delivery, Route Handlers for verification |
| Styling | Tailwind CSS v4 + CSS variables per skin | Skins are token swaps; fast |
| State | Zustand (per-game store) + React Query for server data | Simple, testable game state outside React |
| Backend | Supabase: Postgres, Auth (anonymous + magic link + Google), RLS, Edge Functions where needed | Requested; minimal ops |
| Validation | Zod at every boundary (API, content files, URL params) | Typed end to end |
| Testing | Vitest (unit: generators, rules, scoring), Playwright (e2e: play a daily in both modes), Testing Library | Non-negotiable per principle 5 |
| Tooling | npm (workspaces), ESLint (strict + a11y), Prettier, Husky pre-commit (lint + typecheck + unit), GitHub Actions CI | |
| Hosting | Vercel (app), Supabase cloud | |
| Analytics | PostHog (events only, no session recording) | |

### 4.2 Repo layout
```
apps/web/                  Next.js app
  app/                     routes
  components/shell/        header, mode toggle, modals, disguise picker
  components/primitives/   TextRun, TileRow, Slots, Grid, Passes, Actions, Feedback, Log
  skins/                   play/, work-docs/, work-sheets/, work-slack/, ...  (each implements SkinPrimitives)
  games/                   one folder per game: engine.ts, generate.ts, GameView.tsx, share.ts, index.ts
  lib/                     supabase clients, seeds, dates, share encoding, analytics
  content/                 JSON content packs (validated by zod at build)
packages/
  game-core/               Game interface, seeded RNG, scoring, share-grid utils (framework-free)
  rules/                   Policy rule library (pure functions + tests)
supabase/
  migrations/              SQL, RLS policies
  functions/               edge functions (verify-result, policy-probe)
docs/                      SPEC.md (this), ADRs (docs/adr/NNNN-*.md)
```

### 4.3 Game interface (packages/game-core)
```ts
export interface Game<P, S, M> {
  id: GameId;                       // 'braid' | 'audit' | ...
  meta: { name: string; tagline: string; checks: number; hints: number };
  generate(seed: number, difficulty: Difficulty): P;   // pure, deterministic
  init(puzzle: P): S;
  reduce(state: S, move: M): S;     // pure; all interaction goes through moves
  check(state: S): { state: S; result: CheckResult };
  hint(state: S): S;
  isDone(state: S): boolean;
  score(state: S): Score;           // used for leaderboards
  shareGrid(state: S): string;
  render(state: S, dispatch: (m: M) => void, skin: SkinPrimitives): ReactNode;
}
```
Key consequence: because state changes are a pure move log, the **server verifies results by replaying moves** against the same seed. No trust in client scores.

### 4.4 Skins
A skin is a set of React components satisfying `SkinPrimitives` (e.g. `TextRun` renders letters as tiles in Play, as highlighted inline text in Docs, as cells in Sheets, as a message in Slack). Games never import a skin; the shell injects the active one. Adding a disguise = implementing the primitives + chrome, zero game changes.

### 4.5 Data model (Postgres)
- `profiles(id, username, display_name, is_anonymous, created_at)`
- `puzzles(id, game, date, seed, difficulty, content_version)` — one row per game per day, created by a nightly cron (Vercel Cron → route handler) or lazily on first request with an advisory lock.
- `results(id, user_id, puzzle_id, moves jsonb, checks_used, hints_used, won, score, duration_ms, verified, created_at)` unique(user_id, puzzle_id)
- `friendships(user_id, friend_id, status)`
- `policy_games(id, host_id, rule_id, examples, status, created_at)`, `policy_probes(game_id, user_id, word, accepted)`, `policy_guesses(game_id, user_id, rule_id, correct)`
- `entitlements(user_id, key, expires_at)`, `flags(key, enabled, rollout)`
- RLS: users read/write only their rows; leaderboards via `security definer` views that expose username + score only.

### 4.6 Key flows
- **Load daily:** RSC fetches `puzzles` row for (game, local date from cookie/TZ header) → passes seed to client → client generates puzzle locally (content packs are bundled). Nothing about the solution is sent.
- **Submit:** client POSTs `{puzzleId, moves}` → route handler replays with `game.reduce`/`check` → writes `results` with `verified=true`.
- **Challenge link:** `/[game]/p/[code]` where code = base64url of `{seed, difficulty, contentVersion, by, r}`; server-signed HMAC to prevent tampering with the sender's score.
- **Practice:** seed = hash(userId, game, counter); never written to `results`.

### 4.7 Content
All puzzle content lives in versioned JSON validated by zod in a build step (`npm run content:check`). `content_version` is stored on each puzzle so old challenge links keep working after packs change. Copyright rule: all passages, questions, and word lists are original or public-domain; questions carry a source URL.

### 4.8 Accessibility & performance
- Every interactive element keyboard-operable; tiles have `aria-label`s; feedback regions `aria-live`.
- Colour is never the only signal (locked tiles also get bold/underline; strands have labels).
- Respect `prefers-reduced-motion`.
- LCP < 1.5s on mobile for game pages; game engines run in < 5ms per move.

### 4.9 Quality bar
- 100% of engine code (generate/reduce/check/score/rules) unit-tested, including uniqueness tests for generated puzzles.
- One Playwright test per game: play the daily to completion in Play skin and in one Work skin.
- CI blocks merge on: typecheck, lint, unit, e2e (Chromium), content check.
- ADR for every non-obvious decision (docs/adr).

---

## 5. Milestones

> **Current phase: local-only.** M0–M1 are built without Supabase, auth, CI, or deployment. Persistence goes through a `Storage` interface with a localStorage adapter; the Supabase adapter, identity, friends, leaderboards, and async Policy are added in a later phase without changing games or skins.

**M0 — Foundation (repo, CI, Supabase, shell, Play + Docs skins, Braid ported, anonymous identity, daily + practice + challenge links, server verification).** This is the deployable core; everything after is additive.

**M1 — Games:** Audit, Proof, Forecast, Org with content packs and tests. Sheets, Slides, Notion skins.

**M2 — Social:** sign-in upgrade, profiles, friends, leaderboards, stats sync. Slack, Jira, Outlook, Terminal skins.

**M3 — Policy** (async game) + rule library.

**M4 — Polish:** archive, entitlements plumbing, analytics dashboards, PWA install, OG images for share links.

Each milestone ends with: green CI, deployed preview, CHANGELOG entry, and a short demo note in `docs/demos/`.

---

## 6. Open questions (decide during M0, record as ADRs)
1. Local-midnight rollover: cookie-based TZ vs. `Intl` on client with server trusting it (leaderboards then need per-TZ closing). Leaning: puzzles keyed by calendar date; leaderboard for a date closes 36h after the earliest midnight.
2. Anonymous → signed-in merge when the user already has a signed-in account on another device.
3. Whether Forecast allows one retry per question (would need a checks concept).
