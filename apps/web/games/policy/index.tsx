import type { GameModule } from "../types";
import * as engine from "./engine";
import type { PolicyMove, PolicyState } from "./engine";
import { dailySeed, generate, practiceSeed, type PolicyPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <>
    <p className="mb-3.5">
      A hidden rule decides which words fit and which don&rsquo;t. Three words that fit are
      shown up front.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">
        Tap a word to probe it. Each one comes back ✓ (fits) or ✗ (doesn&rsquo;t).
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        After five probes, Guess the rule opens a list of ten candidates.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        One guess only. Fewer probes before a correct guess scores higher.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Stuck? Hint rules out a couple of wrong candidates. Three hints, shown on your
        result as 💡.
      </li>
      <li className="mb-2 ml-[18px] list-disc">A new rule every day.</li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, if <strong>letter</strong> and <strong>ballot</strong> fit but
      <strong> table</strong> doesn&rsquo;t, &ldquo;contains a double letter&rdquo; is still
      alive and &ldquo;six letters long&rdquo; is not.
    </p>
  </>
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
