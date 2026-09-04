import type { GameModule } from "../types";
import * as engine from "./engine";
import type { AuditMove, AuditState } from "./engine";
import { dailySeed, generate, practiceSeed, type AuditPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <>
    <p className="mb-3.5">
      A 5&times;5 ledger with row and column totals in the margins. The totals are the
      originals &mdash; a few cells (3 to 5, depending on the day) have been altered, so
      some rows and columns no longer add up.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">Tap a cell to flag it as altered. Tap again to unflag.</li>
      <li className="mb-2 ml-[18px] list-disc">
        A total shown in red belongs to a line that does not reconcile &mdash; at least one
        of its cells was changed.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Flag exactly as many cells as were altered, then Check. You&rsquo;ll learn how many
        of your flags are correct &mdash; not which ones.
      </li>
      <li className="mb-2 ml-[18px] list-disc">Stuck? Hint reveals one altered cell and locks it in for you.</li>
      <li className="mb-2 ml-[18px] list-disc">Five checks, three hints. A new ledger every day.</li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, a row reading 4 · 9 · 2 against a total of 14 is one short: one of those
      three numbers is not what it was.
    </p>
  </>
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
