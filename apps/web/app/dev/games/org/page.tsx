"use client";

import { GamePageShell } from "@/components/shell/GamePageShell";
import { orgGame } from "@/games/org";
import type { AnyGameModule } from "@/games/types";

/**
 * Internal, unlinked route that exercises Org end-to-end before
 * `games/registry.ts` (merged centrally, not edited by this game's own
 * task — see the Org task's "Registration" note) wires up the real `/org`
 * route. Not part of the shipped app; exercised by
 * `tests/e2e/org.spec.ts`, same spirit as `/dev/games/policy` and
 * `/dev/games/forecast`. Once registry.ts registers `orgGame`, `/org`
 * behaves identically to this route and this file can be deleted.
 */
export default function OrgDevPage(): React.ReactElement {
  return <GamePageShell game={orgGame as unknown as AnyGameModule} source={{ kind: "daily" }} />;
}
