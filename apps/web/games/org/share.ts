import { buildShareGrid, hintSuffix } from "@boardatwork/game-core";
import type { OrgState } from "./engine";
import { MAX_CHECKS } from "./engine";

export function shareGrid(state: OrgState): string {
  const header = `Org ${state.won ? String(state.checksUsed) : "X"}/${String(MAX_CHECKS)}${hintSuffix(state.hintsUsed)}`;
  return buildShareGrid(header, state.history);
}
