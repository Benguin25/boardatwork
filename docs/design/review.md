# Design review — Play and Work screens

Screens under review are the committed PNGs in `docs/design/current/`
(every game × {play, docs, sheets, slack} at 1280×800 and 390×844, the
home page in Play and Docs, and the three Play modals). The reference is
`reference-braid-prototype.html`, captured in `docs/design/reference/`.

Three things wrong per screen, and what happened to each.

---

## Braid — Play (`braid-play-*.png`)

1. **Header type sat 4px low and the nav was 14px too tall.** An unlayered
   `button { font: inherit }` in `globals.css` outranked every `text-[…]`
   utility, so the nav rendered at 16px, and Tailwind's 1.5 line-height
   applied where the prototype leaves it at `normal`. **Fixed** — the reset
   moved into `@layer base` and `.skin-play` sets `line-height: normal`.
   Desktop diff fell from 1.55% to 0.22%.
2. **The strands showed a "0 / 6" count the reference doesn't have.** It
   pushed each centred row off-centre. **Fixed** — the count is screen-reader
   only in Play; Docs still shows it, which is where the reference puts it.
3. **The footer gained a "Board at Work" link the prototype has no room
   for.** **Not fixed, deliberate**: a game page needs a way home, and the
   brief asks for a small back link. It costs ~0.1% of the diff.

## Braid — Docs (`braid-docs-desktop.png`)

1. **The document title bar was 4px short**, because the reference's title
   sits in a text line whose strut adds space below the inline-block.
   **Fixed** — the gap is now stated explicitly (`mt-[6px]`) instead of
   relying on strut behaviour, and the title row centres like the reference.
2. **The toolbar was missing the text-colour and alignment controls**, and
   the Share pill was labelled "Make one". **Fixed** — both controls added,
   and the pill reads "Share" (it still opens the Make one dialog, which is
   what sharing means here).
3. **The comment thread's buttons read "Hint · Clear · Check", the
   reference's read "Run pass · Clear · Hint".** **Not fixed, deliberate**:
   relabelling a game's actions from inside a skin is the coupling this
   rebuild is meant to remove. The order comes from the game.

## Audit — Play (`audit-play-desktop.png`)

1. **Nothing told you which lines were wrong.** **Fixed** — a row or column
   whose displayed cells no longer sum to its (original) total prints its
   total in red. It is a pure derivation from what is already on screen.
2. **The prompt headline wraps to two lines** and is heavier than anything
   else on the page. **Not fixed** — shortening it loses the one sentence
   that explains the mechanic; a smaller lead line is the better fix and is
   a Prompt-primitive change, not an Audit one.
3. **Column totals sit tight under the grid** with no rule separating them.
   **Not fixed** — the reference has no equivalent element to copy, and a
   rule here would be the only one on the page.

## Audit — Sheets (`audit-sheets-desktop.png`)

1. **The row gutter numbers and the puzzle don't line up.** The gutter is a
   fixed 21px rhythm; the puzzle is laid out normally on top. **Not fixed** —
   making the game's rows land on spreadsheet rows means a skin knowing the
   game's row height, which is exactly the coupling ADR-0003 forbids.
2. **The puzzle sits on a white card with a blue outline**, which reads more
   like a dialog than a selected range. **Not fixed** — without the card the
   gridlines run through the numbers and the puzzle becomes unreadable.
3. **The column strip overflowed the viewport at 390px.** **Fixed** — the
   strip clips at the window edge, the way a spreadsheet does.

## Proof — Play (`proof-play-desktop.png`)

1. **Word spacing looked loose** — each word is a button with its own
   padding on top of the space between them. **Not fixed** — tightening it
   below 2px makes the tap targets too close together on mobile.
2. **A flagged word had no non-colour signal.** **Fixed** — a flagged word is
   also `aria-pressed`, and a hint-locked one is bold.
3. **The hover underline was invisible against the passage rule colour.**
   **Fixed** — hover uses `--line` at 2px with a 4px offset, which reads
   against body text without competing with the flag fill.

## Forecast — Play (`forecast-play-desktop.png`)

1. **Answers were scored off-screen**: `reduce` scores and advances in one
   move, so the previous question's result appeared beside the next
   question. **Fixed** — the view holds the score on screen with a "Next
   question" step. The engine is untouched.
2. **The number input and slider both bind to the same value** and the
   slider's thumb jumps when you type. **Not fixed** — correct behaviour,
   but the jump is abrupt; it wants a transition.
3. **The range labels (1800 / 2000) are the only clue to the unit.** **Not
   fixed** — the unit is on the number field, but for a bare year it is
   empty, so the range is doing the work.

## Org — Play (`org-play-desktop.png`)

1. **The 10-column grid was clipped.** Each rotated header still occupied
   its unrotated width, so the table was ~900px wide inside a 560px column.
   **Fixed** — the labels are positioned out of flow, and the table now fits.
2. **Nothing separates the five role columns from the five team columns.**
   **Not fixed** — a divider is a `LogicGrid` feature (a column group), and
   adding it means a new primitive field for one game.
3. **The clue list reads as six empty-looking boxes** before you notice the
   text. **Not fixed** — the boxes are the Log primitive shared with Policy,
   where the chat framing is right; Org would prefer plain lines.

## Policy — Play / Slack (`policy-play-desktop.png`, `policy-slack-desktop.png`)

1. **Probe words rendered as 52px square tiles and overlapped each other.**
   **Fixed** — a `TextRun` whose items are longer than one glyph now renders
   content-width pills. That rule is about the content, not the game.
2. **In Slack the probe words had no affordance at all.** **Fixed** — the kit's
   units take a hover outline in the skin's brand colour when they're tappable.
3. **There is no free-text probe input**, only a fixed pool of tappable
   words. **Not fixed** — documented in `GameView.tsx`; a text input is a new
   primitive that all nine skins would have to implement for one game.

## Home (`home-play-desktop.png`, `home-docs-desktop.png`)

1. **Esc on the home page changed the mode but not the page.** **Fixed** —
   the home page now renders inside the active disguise, cover state and all.
2. **"In progress" was unreachable**: only finished dailies were recorded.
   **Fixed** — `lib/storage/progress.ts` records that a daily was started;
   it never touches results or stats.
3. **The six rows are undifferentiated** — same weight, same rhythm, no sense
   of which is quick. **Not fixed** — needs per-game metadata (typical time)
   that does not exist yet.

## Modals (`modal-*.png`)

1. **The Stats modal shows four zeroes on a first visit** with nothing to
   act on but "Play another". **Not fixed** — matches the reference, which
   does the same.
2. **The Make one dialog produces a link for a random practice puzzle**, not
   the words-and-theme form the reference has. **Not fixed, deliberate** —
   the app generates from seeds, so a words form would have to bypass the
   generator, and the same dialog has to serve all six games.
3. **Focus is placed on the dialog but not trapped inside it.** **Not
   fixed** — Esc closes and the overlay is `aria-modal`, so axe is clean, but
   Tab can still reach the page behind.
