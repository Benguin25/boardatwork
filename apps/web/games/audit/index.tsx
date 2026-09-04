import type { GameModule } from "../types";
import * as engine from "./engine";
import type { AuditMove, AuditState } from "./engine";
import { dailySeed, generate, practiceSeed, type AuditPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>
      A 5&times;5 grid of numbers, with row and column totals in the margins. The totals are correct for the
      original numbers &mdash; but a few cells (3 to 5, depending on the day) now show altered values, so some rows
      and columns no longer add up.
    </p>
    <ul className="list-disc pl-5">
      <li>Tap a cell to flag it as altered. Tap again to unflag.</li>
      <li>Flag exactly as many cells as were altered, then Check. You&rsquo;ll learn how many of your flags are correct &mdash; not which ones.</li>
      <li>Stuck? Hint reveals one altered cell and locks it in for you.</li>
      <li>Five checks, three hints. A new grid every day.</li>
    </ul>
  </div>
);

export const auditGame: GameModule<AuditPuzzle, AuditState, AuditMove> = {
  id: "audit",
  meta: { name: "Audit", tagline: "Find the altered numbers", checks: engine.MAX_CHECKS, hints: engine.MAX_HINTS },
  homeSkin: "sheets",
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
