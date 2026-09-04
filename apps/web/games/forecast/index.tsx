import type { GameModule } from "../types";
import * as engine from "./engine";
import type { ForecastMove, ForecastState } from "./engine";
import { dailySeed, generate, practiceSeed, type ForecastPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <>
    <p className="mb-3.5">
      Five questions with a number for an answer. Type it or drag the slider, then submit
      &mdash; there is no re-checking, so make it count.
    </p>
    <ul className="mb-3.5">
      <li className="mb-2 ml-[18px] list-disc">
        Score comes from how close you land: within 5% of the true value is 3 points, within
        15% is 2, within 40% is 1, otherwise 0.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Each answer is scored on screen before the next question appears.
      </li>
      <li className="mb-2 ml-[18px] list-disc">
        Hint halves the slider&rsquo;s range around the true value. Three hints, shared
        across all five questions.
      </li>
      <li className="mb-2 ml-[18px] list-disc">Fifteen points at stake. A new set of five every day.</li>
    </ul>
    <p className="text-[var(--muted)]">
      For example, if the answer is 88 and you say 92, that is within 5% &mdash; three
      points. Say 130 and you are outside 40% &mdash; nothing.
    </p>
  </>
);

export const forecastGame: GameModule<ForecastPuzzle, ForecastState, ForecastMove> = {
  id: "forecast",
  meta: { name: "Forecast", tagline: "Estimate five numbers", checks: 0, hints: engine.MAX_HINTS },
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
