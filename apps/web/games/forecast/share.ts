import { buildShareGrid, hintSuffix } from "@boardatwork/game-core";
import { MAX_POINTS, type ForecastState } from "./engine";

/** Band emoji per question (SPEC §2: "one line per check, emoji-only, no letters") — no guesses or true answers are ever included. */
function emojiFor(points: number): string {
  if (points === 3) return "🟩";
  if (points === 2) return "🟨";
  if (points === 1) return "🟧";
  return "⬛";
}

export function shareGrid(state: ForecastState): string {
  const totalPoints = state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
  const header = `Forecast ${String(totalPoints)}/${String(MAX_POINTS)}${hintSuffix(state.hintsUsed)}`;
  const lines = state.results.map((r) => (r ? emojiFor(r.points) : "⬜"));
  return buildShareGrid(header, lines);
}
