import { buildShareGrid, hintSuffix, SHARE_EMOJI } from "@boardatwork/game-core";
import type { PolicyState } from "./engine";
import { MIN_PROBES_TO_GUESS } from "./engine";

/** One emoji line: a green square if won, black if lost — no rule or answer revealed. */
export function shareGrid(state: PolicyState): string {
  const probeCount = state.probes.length;
  const header = `Policy ${state.won ? String(probeCount) : "X"} probe${probeCount === 1 ? "" : "s"}${hintSuffix(state.hintsUsed)}`;
  const line = state.won ? SHARE_EMOJI.correct : SHARE_EMOJI.wrong;
  return buildShareGrid(header, [line], state.won ? undefined : `Needed ${String(MIN_PROBES_TO_GUESS)}+ probes to guess.`);
}
