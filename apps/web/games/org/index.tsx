import type { GameModule } from "../types";
import * as engine from "./engine";
import type { OrgMove, OrgState } from "./engine";
import { dailySeed, generate, practiceSeed, type OrgPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>Five people, five roles, five teams — one true org chart. Work it out from the policy notes below the grid.</p>
    <ul className="list-disc pl-5">
      <li>Tap a cell to cycle it empty → yes → no → empty. Marking a cell yes sets the rest of that person&rsquo;s role (or team) columns to no automatically.</li>
      <li>Give every person one yes among the roles and one yes among the teams, then Check. You&rsquo;ll learn how many of the 10 role/team facts are correct — not which.</li>
      <li>Five checks. Stuck? Hint fills in one person&rsquo;s role or team correctly and locks it. Three hints, shown on your result as 💡.</li>
      <li>A new org chart every day.</li>
    </ul>
  </div>
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
