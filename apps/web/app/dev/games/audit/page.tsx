"use client";

import { GamePageShell } from "@/components/shell/GamePageShell";
import { auditGame } from "@/games/audit";
import type { AnyGameModule } from "@/games/types";

/**
 * Internal, unlinked route that exercises Audit end-to-end before
 * `games/registry.ts` (merged centrally, not edited by this game's own
 * task — see the Audit task's "Registration" note) wires up the real
 * `/audit` route. Not part of the shipped app; exercised by
 * `tests/e2e/audit.spec.ts`, same spirit as `/dev/skins/[skin]` for skins
 * and `/dev/games/forecast` for Forecast. Once registry.ts registers
 * `auditGame`, `/audit` behaves identically to this route and this file
 * can be deleted.
 */
export default function AuditDevPage(): React.ReactElement {
  return <GamePageShell game={auditGame as unknown as AnyGameModule} source={{ kind: "daily" }} />;
}
