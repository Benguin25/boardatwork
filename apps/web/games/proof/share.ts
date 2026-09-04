import { buildShareGrid, hintSuffix } from "@boardatwork/game-core";
import type { ProofState } from "./engine";
import { MAX_CHECKS } from "./engine";

export function shareGrid(state: ProofState): string {
  const header = `Proof ${state.won ? String(state.checksUsed) : "X"}/${String(MAX_CHECKS)}${hintSuffix(state.hintsUsed)}`;
  return buildShareGrid(header, state.history);
}
