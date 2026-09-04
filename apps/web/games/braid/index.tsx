import type { GameModule } from "../types";
import * as engine from "./engine";
import type { BraidMove, BraidState } from "./engine";
import { dailySeed, generate, practiceSeed, type BraidPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const swatch = (token: string): React.ReactElement => (
  <span
    aria-hidden="true"
    className="inline-block h-3.5 w-3.5 rounded-[3px] align-[-2px]"
    style={{ background: `var(${token})` }}
  />
);

const help = (
  <>
    <p className="mb-3.5">
      Two or three words were braided into one string. Each word keeps its own letter
      order. Pull them apart.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">
        Tap a letter to colour it {swatch("--accent-a")} or {swatch("--accent-b")}. Tap
        again to change.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Fill every word, then Check. You&rsquo;ll learn how many letters are on the wrong
        strand, and one of them locks into place.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        The theme is hidden until your second check.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Stuck? Hint reveals the theme early, then locks a letter for you. Three hints, and
        they show on your result.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Five checks. A new braid every day; Sundays braid three words.
      </li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, <strong>BLAIDSKE</strong> unbraids into BLAKE and DISK &mdash; each in
      order, no letters left over.
    </p>
  </>
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
