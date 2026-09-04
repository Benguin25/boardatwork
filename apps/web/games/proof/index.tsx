import type { GameModule } from "../types";
import * as engine from "./engine";
import type { ProofMove, ProofState } from "./engine";
import { dailySeed, generate, practiceSeed, type ProofPassage } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>
      Five words in this passage were swapped for a real word one edit away (a single
      letter added, removed, or changed) &mdash; <em>cat &rarr; cot</em>, <em>there &rarr; three</em>.
      Find all five impostors.
    </p>
    <ul className="list-disc pl-5">
      <li>Tap a word to flag it as an impostor. Tap again to unflag it.</li>
      <li>Check tells you how many of your flags are correct, not which ones.</li>
      <li>You win once exactly the 5 true impostors are flagged.</li>
      <li>Stuck? Hint reveals and locks in one impostor for you. Three hints, shown on your result as 💡.</li>
      <li>Five checks. A new passage every day.</li>
    </ul>
  </div>
);

export const proofGame: GameModule<ProofPassage, ProofState, ProofMove> = {
  id: "proof",
  meta: { name: "Proof", tagline: "Spot the swapped-in words", checks: engine.MAX_CHECKS, hints: engine.MAX_HINTS },
  homeSkin: "docs",
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
