import { buildShareGrid, hintSuffix } from "@boardatwork/game-core";
import type { BraidState } from "./engine";
import { MAX_CHECKS } from "./engine";

export function shareGrid(state: BraidState): string {
  const header = `Braid ${state.won ? String(state.checksUsed) : "X"}/${String(MAX_CHECKS)}${hintSuffix(state.hintsUsed)}`;
  return buildShareGrid(header, state.history);
}
