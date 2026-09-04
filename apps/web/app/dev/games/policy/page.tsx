"use client";

import { GamePageShell } from "@/components/shell/GamePageShell";
import { policyGame } from "@/games/policy";
import type { AnyGameModule } from "@/games/types";

/**
 * Internal, unlinked route that exercises Policy end-to-end before
 * `games/registry.ts` (merged centrally, not edited by this game's own
 * task — see the Policy task's "Registration" note) wires up the real
 * `/policy` route. Not part of the shipped app; exercised by
 * `tests/e2e/policy.spec.ts`, same spirit as `/dev/games/forecast` and
 * `/dev/games/audit`. Once registry.ts registers `policyGame`, `/policy`
 * behaves identically to this route and this file can be deleted.
 */
export default function PolicyDevPage(): React.ReactElement {
  return <GamePageShell game={policyGame as unknown as AnyGameModule} source={{ kind: "daily" }} />;
}
