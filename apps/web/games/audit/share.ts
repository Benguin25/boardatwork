import { buildShareGrid, hintSuffix } from "@boardatwork/game-core";
import type { AuditState } from "./engine";
import { MAX_CHECKS } from "./engine";

export function shareGrid(state: AuditState): string {
  const header = `Audit ${state.won ? String(state.checksUsed) : "X"}/${String(MAX_CHECKS)}${hintSuffix(state.hintsUsed)}`;
  return buildShareGrid(header, state.history);
}
