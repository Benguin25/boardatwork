"use client";

import { GamePageShell } from "@/components/shell/GamePageShell";
import { proofGame } from "@/games/proof";
import type { AnyGameModule } from "@/games/types";

/**
 * Internal, unlinked route that exercises Proof end-to-end before
 * `games/registry.ts` (merged centrally, not edited by this game's own
 * task — see the Proof task's "Registration" note) wires up the real
 * `/proof` route. Not part of the shipped app; exercised by
 * `tests/e2e/proof.spec.ts`, same spirit as `/dev/skins/[skin]` for skins
 * and `/dev/games/forecast` for Forecast. Once registry.ts registers
 * `proofGame`, `/proof` behaves identically to this route and this file
 * can be deleted.
 */
export default function ProofDevPage(): React.ReactElement {
  return <GamePageShell game={proofGame as unknown as AnyGameModule} source={{ kind: "daily" }} />;
}
