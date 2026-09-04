import type { GameModule } from "../types";
import * as engine from "./engine";
import type { ProofMove, ProofState } from "./engine";
import { dailySeed, generate, practiceSeed, type ProofPassage } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <>
    <p className="mb-3.5">
      Five words in this passage were swapped for a real word one edit away &mdash; a
      single letter added, removed, or changed. Find all five.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">Tap a word to flag it. Tap again to unflag it.</li>
      <li className="mb-2 ml-[18px] list-disc">
        Check tells you how many of your flags are correct, not which ones.
      </li>
      <li className="mb-2 ml-[18px] list-disc">You win once exactly the five impostors are flagged.</li>
      <li className="mb-2 ml-[18px] list-disc">
        Stuck? Hint reveals and locks in one impostor. Three hints, shown on your result as
        💡.
      </li>
      <li className="mb-2 ml-[18px] list-disc">Five checks. A new passage every day.</li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, &ldquo;the team <strong>met</strong> the deadline&rdquo; may have started
      as &ldquo;the team <strong>met</strong>&rdquo; &mdash; or as
      &ldquo;<strong>set</strong>&rdquo;. Read for sense, not spelling.
    </p>
  </>
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
