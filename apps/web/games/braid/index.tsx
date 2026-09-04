import type { GameModule } from "../types";
import * as engine from "./engine";
import type { BraidMove, BraidState } from "./engine";
import { dailySeed, generate, practiceSeed, type BraidPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>Two or three words were braided into one string. Each word keeps its own letter order. Pull them apart.</p>
    <ul className="list-disc pl-5">
      <li>Tap a letter to colour it into a strand. Tap again to cycle strands, or back to unassigned.</li>
      <li>Fill every letter, then Check. You&rsquo;ll learn how many letters are on the wrong strand, and one locks into place.</li>
      <li>The theme is hidden until your second check.</li>
      <li>Stuck? Hint reveals the theme early, then locks a letter for you. Three hints, shown on your result as 💡.</li>
      <li>Five checks. A new braid every day; Sundays braid three words.</li>
    </ul>
  </div>
);

export const braidGame: GameModule<BraidPuzzle, BraidState, BraidMove> = {
  id: "braid",
  meta: { name: "Braid", tagline: "Untangle the braided words", checks: engine.MAX_CHECKS, hints: engine.MAX_HINTS },
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
