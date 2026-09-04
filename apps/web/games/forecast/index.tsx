import type { GameModule } from "../types";
import * as engine from "./engine";
import type { ForecastMove, ForecastState } from "./engine";
import { dailySeed, generate, practiceSeed, type ForecastPuzzle } from "./generate";
import { render } from "./GameView";
import { shareGrid } from "./share";

const help = (
  <div className="flex flex-col gap-3 text-sm">
    <p>Five questions. Drag the slider to your best estimate, then submit — there&rsquo;s no re-checking, so make it count.</p>
    <ul className="list-disc pl-5">
      <li>Score per question comes from how close you land: within 5% of the true value is 3 points, within 15% is 2, within 40% is 1, otherwise 0.</li>
      <li>Hint narrows the slider&rsquo;s range by half, centred on the true value. You get 3 hints total, shared across all 5 questions.</li>
      <li>Max score is 15. A new set of five every day.</li>
    </ul>
  </div>
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
