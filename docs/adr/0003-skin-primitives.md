# ADR-0003: Skin primitives

## Status
Accepted

## Context
SPEC §1.2.3 and §4.4: "The disguise is a first-class feature, not a theme.
Every game renders through abstract primitives so any disguise can display
it convincingly... Games never import a skin; the shell injects the active
one. Adding a disguise = implementing the primitives + chrome, zero game
changes." CLAUDE.md: "Games never know about skins. Render through
`SkinPrimitives` only. If a game needs a new primitive, add it to the
interface and implement it in every skin."

## Decision
- `SkinPrimitives` (apps/web/components/primitives) is the single interface
  a `Game.render` may use: `Chrome`, `TextRun`, `TileRow`, `Slots`, `Grid`,
  `Passage`, `Passes`, `Actions`, `Feedback`, `Log`, `Modal`, `Slider`,
  `LogicGrid`.
- A skin is a folder under `apps/web/skins/<name>/` exporting an object that
  satisfies `SkinPrimitives`, plus a `cover` component (the panic-key fake
  content) and skin metadata (tab title suffix, favicon). The shell
  (`components/shell`) is the only code that picks a skin and passes it into
  `game.render(state, dispatch, skin)`.
- If a game needs a primitive that doesn't exist, the primitive is added to
  `SkinPrimitives` and implemented in **all nine** skins before the game may
  use it — never a one-off escape hatch (e.g. a skin-specific prop threaded
  through a game component).
- Primitives are presentational + event-emitting only: they receive data and
  an `onX` callback and render it in the skin's idiom (a letter tile in
  Play, a highlighted span in Docs, a spreadsheet cell in Sheets, a chat
  message in Slack, ...). They never contain game rules.

## Consequences
- Adding a 10th disguise later touches only `apps/web/skins/<new>/` and the
  disguise picker's list — zero diffs in `games/*`.
- Games cannot special-case a skin ("if slack, show X") — CLAUDE.md's "no
  skin-specific code in games" is structurally enforced because `render`
  only ever calls methods on the injected `SkinPrimitives` value, whose
  concrete implementation it never inspects.
- Every new primitive is a breaking interface change reviewed once, not nine
  ad hoc implementations discovered later — Gate 2 checks all nine skins
  render the same placeholder content before any game is built against them.
