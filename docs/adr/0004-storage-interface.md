# ADR-0004: Storage interface (local adapter now, Supabase later)

## Status
Accepted

## Context
This run is local-only (no Supabase, no auth, no server). SPEC §4.5/§4.6
describe a `results` table and server-verified submission that don't exist
yet. CLAUDE.md: "Storage goes through `Storage`. No direct `localStorage`,
`fetch`, or Supabase calls anywhere except adapters in `lib/storage/`."

## Decision
- Define `Storage` in `packages/game-core` with the operations the shell and
  games need regardless of backend: `getResult`, `saveResult`, `getStats`,
  `getSettings`, `saveSettings`, `listResults`. All are `async` even though
  `LocalStorageAdapter` is synchronous under the hood, so a future
  network-backed adapter is a non-breaking swap.
- `LocalStorageAdapter` (apps/web/lib/storage) implements `Storage` against
  `window.localStorage`, namespaced under `boardatwork:v1:`, validated with
  Zod on read so a corrupt or old-shape value never crashes the app.
- `MemoryAdapter` (packages/game-core) implements `Storage` in-process for
  unit tests and for any server-side code path that needs a throwaway store.
- The shell obtains its `Storage` instance from a single factory
  (`lib/storage/index.ts`) so swapping the local adapter for a Supabase
  adapter later is a one-file change; no component or game imports
  `LocalStorageAdapter` directly.
- Challenge-code encode/decode (`packages/game-core/challenge-code.ts`) is
  unsigned base64url JSON for now, with `sign`/`verify` functions already
  present as identity (no-op) implementations so the seam SPEC §4.6 asks for
  ("server-signed HMAC to prevent tampering") exists without an HMAC secret
  to manage in this local-only run.

## Consequences
- Adding the Supabase adapter later (SPEC §3.2–3.4, §4.5) means writing one
  new class satisfying `Storage` and swapping the factory — games, skins,
  and the shell are unaffected.
- Anonymous local stats (SPEC §3.4 "mirrored in localStorage for anonymous")
  are the only stats that exist in this run; "server-side for signed-in
  users" is deferred until identity exists.
- Turning on challenge-code signing later means implementing `sign`/`verify`
  for real and rotating the identity stubs out — call sites don't change.
