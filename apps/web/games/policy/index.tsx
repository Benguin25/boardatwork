import type { GameModule } from "../types";
import * as engine from "./engine";
import type { PolicyMove, PolicyState } from "./engine";
import { dailySeed, generate, practiceSeed, type PolicyPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>
      A hidden rule decides which words &ldquo;fit&rdquo; and which don&rsquo;t. Three example words that fit are
      shown up front.
    </p>
    <ul className="list-disc pl-5">
      <li>Tap words to probe them. Each one comes back ✓ (fits) or ✗ (doesn&rsquo;t fit).</li>
      <li>Once you&rsquo;ve made at least 5 probes, Guess the rule opens a list of 10 possible rules.</li>
      <li>One guess only — get it right to win. Fewer probes before a correct guess scores higher.</li>
      <li>Stuck? Hint rules out a couple of wrong options from the guess list. Three hints, shown on your result as 💡.</li>
      <li>A new hidden rule every day.</li>
    </ul>
  </div>
);

export const policyGame: GameModule<PolicyPuzzle, PolicyState, PolicyMove> = {
  id: "policy",
  meta: {
    name: "Policy",
    tagline: "Probe the examples, guess the hidden rule",
    checks: engine.MIN_PROBES_TO_GUESS,
    hints: engine.MAX_HINTS,
  },
  homeSkin: "slack",
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
