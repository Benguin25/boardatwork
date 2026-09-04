import type { GameModule } from "../types";
import * as engine from "./engine";
import type { OrgMove, OrgState } from "./engine";
import { dailySeed, generate, practiceSeed, type OrgPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <>
    <p className="mb-3.5">
      Five people, five roles, five teams &mdash; one true org chart. Work it out from the
      notes above the grid.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">
        Tap a cell to cycle it empty &rarr; ✓ &rarr; ✗ &rarr; empty. Marking a cell ✓ sets
        the rest of that person&rsquo;s role (or team) columns to ✗ for you.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Give every person one ✓ among the roles and one ✓ among the teams, then Check.
        You&rsquo;ll learn how many of the ten facts are right &mdash; not which.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Stuck? Hint fills in one person&rsquo;s role or team correctly and locks it. Three
        hints, shown on your result as 💡.
      </li>
      <li className="mb-2 ml-[18px] list-disc">Five checks. A new chart every day.</li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, &ldquo;Priya does not sit in Payments&rdquo; is an ✗ in one cell; the four
      other teams in her row stay open until something rules them out too.
    </p>
  </>
);

export const orgGame: GameModule<OrgPuzzle, OrgState, OrgMove> = {
  id: "org",
  meta: { name: "Org", tagline: "Untangle the org chart", checks: engine.MAX_CHECKS, hints: engine.MAX_HINTS },
  homeSkin: "slides",
  help,
  dailySeed,
  practiceSeed,
  generate,
  init: engine.init,
  reduce: engine.reduce,
  check: engine.check,
  hint: engine.hint,
  isDone: engine.isDone,
  score: engine.score,
  shareGrid,
  render,
};
