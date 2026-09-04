# ADR-0001: Stack

## Status
Accepted

## Context
SPEC §4.1 specifies Next.js 15 (App Router) + React 19 + TypeScript strict,
Tailwind CSS v4, Zustand + React Query, Supabase, Zod, Vitest + Playwright +
Testing Library, npm workspaces, ESLint (strict + a11y) + Prettier.

This build (per the run's kickoff prompt) is **local-only**: no database, no
auth, no deployment, no CI. SPEC §3.2–3.3, §4.5, and the Supabase parts of
§4.6 are out of scope for this run.

## Decision
- Adopt the full stack from SPEC §4.1 except the backend: no Supabase client,
  no Postgres, no Edge Functions, no PostHog, no Vercel Cron, no GitHub
  Actions CI, no Husky. React Query is deferred until there is a server to
  query — Stage 0–4 games load content that's already bundled at build time,
  so it isn't needed yet; it is not installed to avoid an unused dependency.
- Persistence goes through a `Storage` interface (packages/game-core) with a
  `LocalStorageAdapter` for the browser and a `MemoryAdapter` for tests. A
  Supabase-backed adapter is a drop-in implementation of the same interface
  later (see ADR-0004).
- npm workspaces only, per CLAUDE.md. `jsdom` pinned to `^29.1.1` everywhere
  it's a dependency.
- ESLint 9 flat config + `eslint-plugin-jsx-a11y` (errors, not warnings) in
  `apps/web`; `typescript-eslint` strict-type-checked in the framework-free
  packages.

## Consequences
- No code path may assume there will never be a server (CLAUDE.md
  non-negotiable): every game's interactions are logged as `Move`s so a
  future route handler can replay and verify them, exactly as SPEC §4.3
  describes, even though nothing currently reads that log server-side.
- Re-introducing Supabase, auth, CI, and deployment later touches only the
  storage adapter, an identity module, and infra config — never `games/*` or
  `skins/*`.
